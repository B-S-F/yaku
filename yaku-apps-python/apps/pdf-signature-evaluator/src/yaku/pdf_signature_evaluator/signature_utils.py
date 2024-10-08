from io import BufferedReader
from pathlib import Path
from typing import List

from loguru import logger
from pyhanko.pdf_utils.misc import PdfStrictReadError
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.ades.report import AdESIndeterminate
from pyhanko.sign.general import load_certs_from_pemder_data
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko.sign.validation.errors import SignatureValidationError
from pyhanko.sign.validation.pdf_embedded import EmbeddedPdfSignature
from pyhanko.sign.validation.settings import KeyUsageConstraints
from pyhanko.sign.validation.status import PdfSignatureStatus
from pyhanko_certvalidator import ValidationContext
from yaku.autopilot_utils.checks import check
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.autopilot_utils.results import RESULTS, Result
from yaku.pdf_signature_evaluator.constants import ERROR_MESSAGES


def verify_signatures(
    pdf_path: Path,
    vc: ValidationContext,
    signatures: List[EmbeddedPdfSignature],
    check_modification: bool = False,
):
    criterion = f"PDF {pdf_path.name} must have valid signature(s)"

    try:
        # By default, pyHanko requires signer certificates to have the non-repudiation key usage extension bit
        # set on signer certificates. This is currently not relevant for us and we therefore disable this
        # check.
        overall_status = True

        for sig in signatures:
            status = validate_pdf_signature(
                sig, vc, key_usage_settings=KeyUsageConstraints(key_usage=set())
            )

            sig_status = is_signature_valid(
                status, check_modification=check_modification
            )  # replaces status.bottom_line
            overall_status = overall_status and sig_status

            justification = f"PDF {pdf_path.name} has valid signature(s)"
            if status.bottom_line == False:
                justification = f"PDF {pdf_path.name} has invalid signature(s)"

                if status.trust_problem_indic:
                    validation_status_enum = AdESIndeterminate(status.trust_problem_indic)

                    if validation_status_enum == AdESIndeterminate.OUT_OF_BOUNDS_NO_POE:
                        justification = f"{ERROR_MESSAGES[validation_status_enum]} {status.signer_reported_dt}"

                    elif status.trust_problem_indic in [
                        AdESIndeterminate.REVOKED_NO_POE,
                        AdESIndeterminate.REVOKED_CA_NO_POE,
                    ]:
                        justification = f"{ERROR_MESSAGES[validation_status_enum]} {status.signer_reported_dt}"

                    elif status.trust_problem_indic in [
                        AdESIndeterminate.CHAIN_CONSTRAINTS_FAILURE,
                        AdESIndeterminate.NO_POE,
                    ]:
                        justification = ERROR_MESSAGES[validation_status_enum]

                    logger.debug(f"Validation status '{validation_status_enum}'")

                logger.info(status.pretty_print_details())
            logger.debug(f"PDF {pdf_path.name}, {justification}")

        return Result(
            criterion=criterion,
            fulfilled=overall_status,
            justification=f"PDF {pdf_path.name} has {'valid' if overall_status else 'invalid'} signature(s)",
        )

    except AssertionError:
        return Result(
            criterion=criterion,
            fulfilled=False,
            justification=f"PDF {pdf_path.name} is not signed",
        )

    except SignatureValidationError as e:
        raise AutopilotConfigurationError(
            f"error while verifying signatures in {pdf_path.name}: {e}\nPlease check the known limitations in the pyHanko documentation https://pyhanko.readthedocs.io/en/latest/known-issues.html."
        )


def extract_signatures(pdf_path: Path, pdf: BufferedReader, strict: bool):
    try:
        signatures = PdfFileReader(pdf, strict=strict).embedded_signatures
        return signatures

    except PdfStrictReadError as e:
        logger.debug("{error}", error=e)

        raise AutopilotError(
            f"error while verifying signature(s) in strict mode in {pdf_path.name}: \nThe signature(s) might be corrupted. Please try disabling the IS_STRICT_MODE environment variable."
        )
    except Exception as e:
        raise AutopilotError(
            f"unknown error while verifying signatures in {pdf_path.name}: {e}"
        )


def verifiy_signature_date(
    vc: ValidationContext,
    signatures: List[EmbeddedPdfSignature],
    date_configuration,
):
    rule = date_configuration[0].rules[0]
    signature_dates = []
    for sig in signatures:
        status = validate_pdf_signature(
            sig, vc, key_usage_settings=KeyUsageConstraints(key_usage=set())
        )
        signature_dates.append(status.signer_reported_dt)

    logger.debug(f"Signature dates: {signature_dates}")

    signature_date_checks = list()
    for date in signature_dates:
        signature_date_checks.append(
            check(
                checked_value=str(date),
                operator=rule.operator,
                other_value=str(rule.other_value),
            )
        )

    any_all = rule.property
    outcome = any(signature_date_checks) if any_all == "one-of" else all(signature_date_checks)
    quantity = as_string_from(outcome, any_all)

    return Result(
        criterion=f"Check that {any_all} signature date(s) are not older than {rule.other_value}",
        fulfilled=outcome,
        justification=f"{quantity} signature date(s) is(are) not older than the specified date",
    )


def as_string_from(outcome, any_all):
    if outcome:
        return "All" if any_all == "all-of" else "At least one"
    else:
        return "Not all" if any_all == "all-of" else "None"


def validate_pdf_signatures(
    pdf_paths: List[Path],
    certificate_paths: List[Path],
    strict: bool,
    signature_date_configuration,
) -> bool:
    certificates = []
    asn1crypto_x509_certificates = []

    for certificate in certificate_paths:
        read_certificate = certificate.read_bytes()
        certificates.append(read_certificate)

    for cert in certificates:
        asn1crypto_x509_certificates = load_certs_from_pemder_data(cert)

    vc = ValidationContext(trust_roots=asn1crypto_x509_certificates)

    valid_pdfs = 0
    total_pdfs = len(pdf_paths)

    for pdf in pdf_paths:
        with pdf.open("rb") as pdf_io:
            signatures = extract_signatures(pdf, pdf_io, strict)

            pdf_file_name = pdf.stem + pdf.suffix
            date_configuration = [
                sig_dt_configuration
                for sig_dt_configuration in signature_date_configuration
                if sig_dt_configuration.file == pdf_file_name
            ]

            if not signatures:
                result = Result(
                    criterion=f"PDF {pdf.name} must have valid signature(s)",
                    fulfilled=False,
                    justification=f"No signature(s) found in PDF {pdf.name}",
                )
                RESULTS.append(result)
                outcome = False

            elif not date_configuration:
                signature_result = verify_signatures(pdf, vc, signatures)
                RESULTS.append(signature_result)
                outcome = signature_result.fulfilled

            else:
                signature_result = verify_signatures(pdf, vc, signatures)
                RESULTS.append(signature_result)
                date_result = verifiy_signature_date(vc, signatures, date_configuration)
                RESULTS.append(date_result)
                outcome = signature_result.fulfilled and date_result.fulfilled

            if outcome:
                valid_pdfs = valid_pdfs + 1

    all_pdfs_valid = valid_pdfs == total_pdfs
    RESULTS.append(
        Result(
            criterion="All PDF signatures must be in order",
            fulfilled=all_pdfs_valid,
            justification=f"{valid_pdfs} out of {total_pdfs} PDFs are signed",
        )
    )

    return all_pdfs_valid


def is_signature_valid(
    signature_status: PdfSignatureStatus,
    check_ts: bool = True,
    check_content_ts: bool = True,
    check_intact: bool = True,
    check_valid: bool = True,
    check_trusted: bool = True,
    check_seed_value_ok: bool = True,
    check_modification: bool = True,
) -> bool:
    ts = signature_status.timestamp_validity
    if ts is None:
        timestamp_ok = True
    else:
        timestamp_ok = ts.valid and ts.intact and ts.trusted

    content_ts = signature_status.content_timestamp_validity
    if content_ts is None:
        content_timestamp_ok = True
    else:
        content_timestamp_ok = content_ts.valid and content_ts.intact and content_ts.trusted

    return (
        (signature_status.intact or not check_intact)
        and (signature_status.valid or not check_valid)
        and (signature_status.trusted or not check_trusted)
        and (timestamp_ok or not check_ts)
        and (content_timestamp_ok or not check_content_ts)
        and (signature_status.seed_value_ok or not check_seed_value_ok)
        and (
            (signature_status.docmdp_ok or signature_status.modification_level is None)
            or not check_modification
        )
    )
