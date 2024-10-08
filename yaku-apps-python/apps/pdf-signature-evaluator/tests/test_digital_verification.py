from pathlib import Path

import pytest
from yaku.autopilot_utils.errors import AutopilotError
from yaku.pdf_signature_evaluator import digital_signature_verification as dsv


class TestDigitalVerification:
    def test_get_file_list_exception(self, mocker):
        mocked_is_file = mocker.patch(
            "yaku.pdf_signature_evaluator.digital_signature_verification.Path.is_file"
        )
        mocked_is_file.side_effect = Exception
        with pytest.raises(AutopilotError):
            dsv.get_file_list(Path("test/root.pdf"), ".pdf")
