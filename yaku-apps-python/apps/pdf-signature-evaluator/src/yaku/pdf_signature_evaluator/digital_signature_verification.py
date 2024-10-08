# filter list for pdf files
# read pdf file (check if corrupt)
# get list of digital signatures
# validate signatures
# list of persons
# validate against a list of people

import os
from pathlib import Path
from typing import Optional

from loguru import logger
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.autopilot_utils.results import RESULTS, Result
from yaku.pdf_signature_evaluator.config import ConfigFile
from yaku.pdf_signature_evaluator.filesystem_utils import (
    get_certificate_paths,
    get_file_list,
)
from yaku.pdf_signature_evaluator.rules import read_file_rules
from yaku.pdf_signature_evaluator.signature_utils import validate_pdf_signatures
from yaku.pdf_signature_evaluator.signer_utils import get_signers_dictionary

from .signer_verification import SignatureComparison

current_dir = os.path.dirname(__file__)
expected_signers_information = None


def digital_signature_verification(
    pdf_location: Path,
    certificate_location: Path,
    validate_signers: bool,
    configuration_file: Optional[Path] = None,
    strict: bool = True,
):
    pdf_list = get_file_list(pdf_location, ".pdf")
    if len(pdf_list) == 0:
        raise AutopilotConfigurationError("No PDF files found in the given location.")
    logger.debug("using pdfs: {}", str([pdf_list[i].stem for i in range(len(pdf_list))]))

    certificates = get_certificate_paths(certificate_location)
    if len(certificates) == 0:
        raise AutopilotConfigurationError("No certificates found in the given location.")

    certificate_names = {certificates[i].stem for i in range(len(certificates))}
    logger.debug("using certificates: {}", str(certificate_names))

    signature_date_configuration = []
    if configuration_file:
        signature_date_configuration_file = ConfigFile(file_path=str(configuration_file))
        signature_date_configuration = read_file_rules(
            signature_date_configuration_file.content
        )

    are_all_signatures_valid = validate_pdf_signatures(
        pdf_list, certificates, strict, signature_date_configuration
    )

    real_signers = get_signers_dictionary(pdf_list, certificate_names)
    logger.debug("found signers: {}", str([real_signers[pdf] for pdf in real_signers]))

    expected_signers_information = SignatureComparison(configuration_file)

    if not configuration_file or not expected_signers_information.get_expected_signers():
        if validate_signers:
            raise AutopilotConfigurationError(
                "missing configuration file or expected signers configuration"
            )

        RESULTS.append(
            Result(
                criterion="Signer validation",
                fulfilled=True,
                justification="Signer validation is disabled",
            )
        )
        return

    are_all_expected_signers_present = expected_signers_information.validate_expected_signers(
        real_signers
    )

    if are_all_signatures_valid and are_all_expected_signers_present:
        RESULTS.append(
            Result(
                criterion="All expected signers must have signed the PDFs.",
                fulfilled=True,
                justification="All expected signers are found.",
            )
        )
    else:
        for result in expected_signers_information.get_results():
            RESULTS.append(result)
