from pathlib import Path
from unittest import mock

from yaku.pdf_signature_evaluator import filesystem_utils as fu


class TestFilesystemUtils:
    def test_get_single_file_list(self, mocker):
        mocked_is_file = mocker.patch(
            "yaku.pdf_signature_evaluator.filesystem_utils.Path.is_file"
        )
        mocked_is_file.return_value = True
        assert fu.get_file_list(Path("root/file.pdf"), ".pdf") == [
            Path("root/file.pdf"),
        ]

    def test_get_single_file_list_not_file(self, mocker):
        mocked_is_file = mocker.patch(
            "yaku.pdf_signature_evaluator.filesystem_utils.Path.is_file"
        )
        mocked_is_file.return_value = False
        assert fu.get_file_list(Path("root/folder"), ".pdf") == []

    def test_get_file_list(self, mocker):
        mocked_is_file = mocker.patch(
            "yaku.pdf_signature_evaluator.filesystem_utils.Path.is_file"
        )
        mocked_is_file.side_effect = [False, True, True, True]
        mocked_is_dir = mocker.patch(
            "yaku.pdf_signature_evaluator.filesystem_utils.Path.is_dir"
        )
        mocked_is_dir.return_value = True
        mocked_rglob = mocker.patch("yaku.pdf_signature_evaluator.filesystem_utils.Path.rglob")
        mocked_rglob.return_value = [
            Path("root/file1.pdf"),
            Path("root/file2.pdf"),
            Path("root/file3.pdf"),
        ]
        assert fu.get_file_list(Path("root"), ".pdf") == [
            Path("root/file1.pdf"),
            Path("root/file2.pdf"),
            Path("root/file3.pdf"),
        ]


def test_get_certificate_paths(mocker: mock):
    def mock_file_list(path, suffix):
        if suffix == ".pem":
            return [Path("a.pem"), Path("b.pem")]
        elif suffix == ".crt":
            return [Path("c.crt")]

    get_file_list_mock: mock.Mock = mocker.patch(
        "yaku.pdf_signature_evaluator.filesystem_utils.get_file_list"
    )
    get_file_list_mock.side_effect = mock_file_list

    paths = fu.get_certificate_paths(Path())
    assert set(paths) == {Path("a.pem"), Path("b.pem"), Path("c.crt")}


def test_get_pdf_paths(mocker: mock):
    get_file_list_mock: mock.Mock = mocker.patch(
        "yaku.pdf_signature_evaluator.filesystem_utils.get_file_list"
    )
    get_file_list_mock.return_value = [Path("foo")]

    input_path = Path()
    pdf_paths = fu.get_pdf_paths(input_path)

    assert pdf_paths == [Path("foo")]
    get_file_list_mock.assert_called_once_with(input_path, ".pdf")
