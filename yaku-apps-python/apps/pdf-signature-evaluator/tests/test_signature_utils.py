from pathlib import Path

import pytest
from mock import MagicMock
from pyhanko.pdf_utils.misc import PdfStrictReadError
from pyhanko.sign.ades.report import AdESIndeterminate
from pyhanko.sign.validation.errors import SignatureValidationError
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.autopilot_utils.results import RESULTS, Result, protect_results
from yaku.pdf_signature_evaluator import signature_utils as su
from yaku.pdf_signature_evaluator.rules import FileRules, Rule


class CallableWithSideEffect:
    def __init__(self, side_effects):
        self.side_effects = side_effects
        self.call_count = 0

    @property
    def signer_reported_dt(self, *args, **kwargs):
        self.call_count += 1
        return self.side_effects[self.call_count - 1]


class TestSignatureUtils:
    @protect_results
    def test_verify_signatures_valid(self, mocker):
        pdf_list = [Path("file.pdf")]
        certificate_list = []

        mocker.patch("yaku.pdf_signature_evaluator.signature_utils.Path.open")
        mocked_extract_signatures = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.extract_signatures"
        )
        mocked_verify_signatures = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.verify_signatures"
        )

        mocked_extract_signatures.return_value = [MagicMock()]
        mocked_verify_signatures.return_value = Result(
            criterion="All PDF signatures must be in order",
            fulfilled=True,
            justification="All expected signers are found",
        )

        validity = su.validate_pdf_signatures(pdf_list, certificate_list, True, [])
        assert validity

    @protect_results
    def test_verify_signatures_invalid(self, mocker):
        pdf_list = [Path("file.pdf")]
        certificate_list: list = []

        mocker.patch("yaku.pdf_signature_evaluator.signature_utils.Path.open")
        mocked_extract_signatures = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.extract_signatures"
        )
        mocked_verify_signatures = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.verify_signatures"
        )

        mocked_extract_signatures.return_value = [MagicMock()]
        mocked_verify_signatures.return_value = Result(
            criterion="All PDF signatures must be in order",
            fulfilled=False,
            justification="Some expected signers are not found",
        )
        validity = su.validate_pdf_signatures(pdf_list, certificate_list, False, [])
        assert not validity

    @protect_results
    def test_verify_signatures(self, mocker):
        signatures = [MagicMock()]
        mocked_validate_pdf_signature = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )
        mocked_signature_valid = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.is_signature_valid"
        )

        mocked_signature_valid.return_value = True
        mocked_validate_pdf_signature.return_value.bottom_line = True
        mocked_validate_pdf_signature.return_value.trust_problem_indic = None
        good_result = su.verify_signatures(Path("file.pdf"), None, signatures)

        mocked_signature_valid.return_value = False
        mocked_validate_pdf_signature.return_value.bottom_line = False
        mocked_validate_pdf_signature.return_value.trust_problem_indic = (
            AdESIndeterminate.EXPIRED
        )

        bad_result = su.verify_signatures(Path("file.pdf"), None, signatures)
        assert good_result.fulfilled
        assert not bad_result.fulfilled

    @protect_results
    def test_verify_signatures_no_signatures(self, mocker):
        mocker.patch("yaku.pdf_signature_evaluator.signature_utils.Path.open")
        mocked_extract_signature = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.extract_signatures"
        )
        mocked_extract_signature.return_value = []

        su.validate_pdf_signatures([Path("file.pdf")], [], True, [])

        no_signature_result = RESULTS[0]
        assert not no_signature_result.fulfilled
        assert "No signature(s) found" in no_signature_result.justification

    @protect_results
    def test_verify_signatures_with_error_messages(self, mocker):
        signatures = [MagicMock()]

        mocked_validate_pdf_signature = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )

        mocked_signature_valid = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.is_signature_valid"
        )

        invalid_statuses = [
            AdESIndeterminate.OUT_OF_BOUNDS_NO_POE,
            AdESIndeterminate.REVOKED_NO_POE,
            AdESIndeterminate.REVOKED_CA_NO_POE,
            AdESIndeterminate.CHAIN_CONSTRAINTS_FAILURE,
            AdESIndeterminate.NO_POE,
        ]

        mocked_pretty_print_details = mocker.MagicMock()
        mocked_pretty_print_details.return_value = "Pretty information on validation status"

        mocked_signature_valid.return_value = False
        mocked_validate_pdf_signature.return_value.bottom_line = False
        mocked_validate_pdf_signature.return_value.pretty_print_details = (
            mocked_pretty_print_details
        )

        for status in invalid_statuses:
            mocked_validate_pdf_signature.return_value.trust_problem_indic = status
            bad_result = su.verify_signatures(Path("file.pdf"), None, signatures)

            assert not bad_result.fulfilled

            # there is a single result for each pdf even if there are multiple signatures
            # -> justification cannot hold the details of the single errors,
            # rather it is an overall message
            # assert ERROR_MESSAGES[status] in bad_result.justification

        mocked_validate_pdf_signature.return_value.trust_problem_indic = None
        bad_result = su.verify_signatures(Path("file.pdf"), None, signatures)

        assert not bad_result.fulfilled
        assert "has invalid signature(s)" in bad_result.justification

    @protect_results
    def test_verify_signatures_assertion_error(self, mocker):
        signatures = [mocker.MagicMock()]
        mocked_pdf_verify = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )
        mocked_pdf_verify.side_effect = AssertionError

        result = su.verify_signatures(Path("file.pdf"), None, signatures)
        assert not result.fulfilled

    @protect_results
    def test_verify_signatures_signature_validation_error(self, mocker):
        signatures = [mocker.MagicMock()]
        mocked_pdf_verify = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )
        mocked_pdf_verify.side_effect = SignatureValidationError(
            "Settings do not permit validation of signatures in hybrid-reference files"
        )
        with pytest.raises(
            AutopilotConfigurationError,
            match="Settings do not permit validation of signatures in hybrid-reference files",
        ):
            su.verify_signatures(Path("file.pdf"), None, signatures)

    @protect_results
    def test_verify_signatures_pdf_strict_read_error(self, mocker):
        mocked_file_reader = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.PdfFileReader"
        )
        mocked_file_reader.side_effect = PdfStrictReadError("Corrupted signatures")
        with pytest.raises(
            AutopilotError,
            match=r"error while verifying signature\(s\) in strict mode",
        ):
            su.extract_signatures(Path("file.pdf"), None, True)

    @protect_results
    def test_extract_signatures_unspecified_error(self, mocker):
        mocked_file_reader = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.PdfFileReader"
        )
        mocked_file_reader.side_effect = Exception("I am an error")
        with pytest.raises(AutopilotError, match="I am an error"):
            su.extract_signatures(Path("file.pdf"), None, True)

    def test_all_signature_dates_not_older_than_interval(self, mocker):
        mocked_pdf_signature_validator = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature",
            autospec=True,
        )

        m = CallableWithSideEffect(["2024-03-01", "2024-01-01T00:00:00Z"])
        mocked_pdf_signature_validator.return_value = m

        signatures = [MagicMock(), MagicMock()]
        date_configuration = [
            FileRules(
                "file.pdf",
                [
                    Rule(
                        property="all-of",
                        operator="not-older-than",
                        other_value="2024-01-01T00:00:00Z",
                    )
                ],
            )
        ]
        result = su.verifiy_signature_date(None, signatures, date_configuration)

        assert result.fulfilled
        assert "All" in result.justification

    def test_at_least_one_signature_dates_not_older_than_interval(self, mocker):
        mocked_pdf_signature_validator = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )

        m = CallableWithSideEffect(["2024-03-01", "2023-12-31"])
        mocked_pdf_signature_validator.return_value = m

        signatures = [MagicMock(), MagicMock()]
        date_configuration = [
            FileRules(
                "file.pdf",
                [
                    Rule(
                        property="one-of",
                        operator="not-older-than",
                        other_value="2024-01-01T00:00:00Z",
                    )
                ],
            )
        ]
        result = su.verifiy_signature_date(None, signatures, date_configuration)

        assert result.fulfilled
        assert "At least one" in result.justification

    def test_not_all_signature_dates_not_older_than_interval(self, mocker):
        mocked_pdf_signature_validator = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )

        m = CallableWithSideEffect(["2024-03-01", "2023-12-31"])
        mocked_pdf_signature_validator.return_value = m

        signatures = [MagicMock(), MagicMock()]
        date_configuration = [
            FileRules(
                "file.pdf",
                [
                    Rule(
                        property="all-of",
                        operator="not-older-than",
                        other_value="2024-01-01T00:00:00Z",
                    )
                ],
            )
        ]
        result = su.verifiy_signature_date(None, signatures, date_configuration)

        assert not result.fulfilled
        assert "Not all" in result.justification

    def test_none_signature_dates_not_older_than_interval(self, mocker):
        mocked_pdf_signature_validator = mocker.patch(
            "yaku.pdf_signature_evaluator.signature_utils.validate_pdf_signature"
        )

        m = CallableWithSideEffect(["2022-03-01", "2022-01-02"])
        mocked_pdf_signature_validator.return_value = m

        signatures = [MagicMock(), MagicMock()]
        date_configuration = [
            FileRules(
                "file.pdf",
                [
                    Rule(
                        property="one-of",
                        operator="not-older-than",
                        other_value="2024-01-01T00:00:00Z",
                    )
                ],
            )
        ]
        result = su.verifiy_signature_date(None, signatures, date_configuration)

        assert not result.fulfilled
        assert "None" in result.justification
