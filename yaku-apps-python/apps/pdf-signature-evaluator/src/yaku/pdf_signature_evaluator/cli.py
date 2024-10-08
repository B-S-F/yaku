from pathlib import Path
from typing import Optional

import click
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import ResultsCollector

from .digital_signature_verification import digital_signature_verification


class CLI:
    click_name = "pdf-signature-evaluator"
    click_help_text = "Evaluate signatures in PDF files."
    click_setup = [
        click.option(
            # redundant option since it could be addressed directly in the configuration file, also it is not a scalable approach to require a boolean flag for each different check in the configuration
            # the proposal is to deprecate it in future releases
            "--validate-signers",
            envvar="VALIDATE_SIGNERS",
            is_flag=True,
            default=False,
            help="Enable validation of signers",
        ),
        click.option(
            "--configuration",
            envvar=["SIGNER_FILE_LOCATION", "CONFIGURATION_LOCATION"],
            help="Path to the file containing the expected signers",
            type=click.Path(path_type=Path, file_okay=True, dir_okay=False),
        ),
        click.option(
            "--certificates",
            envvar="CERTIFICATE_LOCATION",
            default="/usr/local/share/ca-certificates/",
            help="Path to the file containing the certificates",
            type=click.Path(exists=True, path_type=Path, file_okay=False, dir_okay=True),
            required=True,
        ),
        click.option(
            "--pdf-location",
            envvar="PDF_LOCATION",
            help="Path to the PDF file(s)",
            type=click.Path(exists=True, path_type=Path, file_okay=True, dir_okay=True),
            required=True,
        ),
        click.option(
            "--strict",
            envvar="IS_STRICT_MODE",
            is_flag=True,
            help="Enable strict mode when verifying signatures",
            default=True,
        ),
    ]

    @staticmethod
    def click_command(
        validate_signers: bool,
        configuration: Optional[Path],
        certificates: Path,
        pdf_location: Path,
        strict: bool,
    ):
        """Trigger the signature evaluation action."""
        logger.info("Starting pdf-signature-evaluator")

        digital_signature_verification(
            pdf_location,
            certificates,
            validate_signers,
            configuration_file=configuration,
            strict=strict,
        )
        logger.info("Finished pdf-signature-evaluator")

    @staticmethod
    def click_evaluator_callback(results: ResultsCollector) -> tuple[str, str]:
        if all([r.fulfilled for r in results]):
            return "GREEN", "All criteria are fulfilled."
        return "RED", "Not all criteria are fulfilled!"


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    main()
