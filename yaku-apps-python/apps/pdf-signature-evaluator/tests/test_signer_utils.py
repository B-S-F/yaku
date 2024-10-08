from pathlib import Path

import pytest
from yaku.autopilot_utils.errors import AutopilotError
from yaku.pdf_signature_evaluator import signer_utils as su

CERTIFICATE_NAMES = {"FOO", "BAR"}


class TestSignerUtils:
    def test_get_signers_dictionary(self, mocker):
        mocked_get_signers = mocker.patch(
            "yaku.pdf_signature_evaluator.signer_utils.get_signers"
        )
        mocked_get_signers.return_value = ["Some.Signer"]
        assert su.get_signers_dictionary([Path("pdf1.pdf")], CERTIFICATE_NAMES) == {
            "pdf1.pdf": ["Some.Signer"]
        }

    def test_get_signers_dictionary_empty(self, mocker):
        mocked_get_signers = mocker.patch(
            "yaku.pdf_signature_evaluator.signer_utils.get_signers"
        )
        mocked_get_signers.return_value = []
        assert su.get_signers_dictionary([Path("pdf1.pdf")], CERTIFICATE_NAMES) == {}

    def test_get_pdf_signers_read_fail(self, mocker):
        mocked_read = mocker.patch("yaku.pdf_signature_evaluator.signer_utils.Path.read_bytes")
        mocked_read.side_effect = Exception
        with pytest.raises(AutopilotError):
            su.get_signers(Path("res/test_bad.pdf"), CERTIFICATE_NAMES)

    def test_get_pdf_signers_no_signature(self, mocker):
        mocked_read = mocker.patch("yaku.pdf_signature_evaluator.signer_utils.Path.read_bytes")
        mocked_read.return_value = b"content pdf without signature"

        assert su.get_signers(Path("file.pdf"), CERTIFICATE_NAMES) == []

    def test_get_pdf_signers_bad_signature(self, mocker):
        mocked_read = mocker.patch("yaku.pdf_signature_evaluator.signer_utils.Path.read_bytes")
        mocked_read.return_value = b"content pdf without signature/ByteRange]"

        assert su.get_signers(Path("test-file.pdf"), CERTIFICATE_NAMES) == []
