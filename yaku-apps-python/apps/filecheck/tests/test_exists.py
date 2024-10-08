import mock
from yaku.autopilot_utils.results import RESULTS, protect_results
from yaku.filecheck.commands.exists import verify_that_file_exists


@protect_results
def test_result_is_correct_if_file_exists():
    path = mock.Mock()
    path.exists = mock.Mock(return_value=True)
    path.__str__ = mock.Mock(return_value="mocked")
    verify_that_file_exists(file=path, glob=False)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.fulfilled == True
    assert result.justification == "File `mocked` exists."


@protect_results
def test_result_is_correct_if_file_does_not_exist():
    path = mock.Mock()
    path.exists = mock.Mock(return_value=False)
    path.__str__ = mock.Mock(return_value="mocked")
    verify_that_file_exists(file=path, glob=False)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.fulfilled == False
    assert result.justification == "File `mocked` doesn't exist!"


@protect_results
def test_result_is_correct_if_glob_matches():
    path = mock.Mock()
    path.parent.glob = mock.Mock(return_value=["1.pdf", "2.pdf", "3.pdf"])
    path.__str__ = mock.Mock(return_value="*.pdf")
    verify_that_file_exists(file=path, glob=True)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.fulfilled == True
    assert result.justification == "3 file(s) were found matching glob pattern `*.pdf`."


@protect_results
def test_result_is_correct_if_glob_does_not_match():
    path = mock.Mock()
    path.parent.glob = mock.Mock(return_value=[])
    path.__str__ = mock.Mock(return_value="*.pdf")
    verify_that_file_exists(file=path, glob=True)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.fulfilled == False
    assert result.justification == "No files were found matching glob pattern `*.pdf`!"
