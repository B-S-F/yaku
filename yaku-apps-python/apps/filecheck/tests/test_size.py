import mock
from yaku.autopilot_utils.results import RESULTS, protect_results
from yaku.filecheck.commands.size import verify_size_of_file


@protect_results
def test_result_is_correct_if_file_has_correct_min_size():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 1
    path.stat.return_value = stat_mock

    verify_size_of_file(path, 1, None)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.criterion == "File `mocked` should be at least 1 bytes large."
    assert result.fulfilled == True
    assert result.justification == "File `mocked` has a size of 1 bytes."


@protect_results
def test_result_is_correct_if_file_has_not_correct_min_size():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 1
    path.stat.return_value = stat_mock

    verify_size_of_file(path, 1000, None)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.criterion == "File `mocked` should be at least 1000 bytes large."
    assert result.fulfilled == False
    assert result.justification == "File `mocked` has a size of 1 bytes."


@protect_results
def test_result_is_correct_if_file_has_correct_max_size():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 1
    path.stat.return_value = stat_mock

    verify_size_of_file(path, None, 1)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.criterion == "File `mocked` should not be larger than 1 bytes."
    assert result.fulfilled == True
    assert result.justification == "File `mocked` has a size of 1 bytes."


@protect_results
def test_result_is_correct_if_file_has_not_correct_max_size():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 1000
    path.stat.return_value = stat_mock

    verify_size_of_file(path, None, 1)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert result.criterion == "File `mocked` should not be larger than 1 bytes."
    assert result.fulfilled == False
    assert result.justification == "File `mocked` has a size of 1000 bytes."


@protect_results
def test_result_is_correct_if_file_is_inside_size_range():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 3
    path.stat.return_value = stat_mock

    verify_size_of_file(path, 2, 4)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert (
        result.criterion
        == "File `mocked` should be at least 2 bytes large and should not be larger than 4 bytes."
    )
    assert result.fulfilled == True
    assert result.justification == "File `mocked` has a size of 3 bytes."


@protect_results
def test_result_is_correct_if_file_is_below_size_range():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 1
    path.stat.return_value = stat_mock

    verify_size_of_file(path, 2, 4)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert (
        result.criterion
        == "File `mocked` should be at least 2 bytes large and should not be larger than 4 bytes."
    )
    assert result.fulfilled == False
    assert result.justification == "File `mocked` has a size of 1 bytes."


@protect_results
def test_result_is_correct_if_file_is_above_size_range():
    path = mock.Mock()
    path.__str__ = mock.Mock(return_value="mocked")
    stat_mock = mock.Mock()
    stat_mock.st_size = 5
    path.stat.return_value = stat_mock

    verify_size_of_file(path, 2, 4)

    assert len(RESULTS) == 1
    result = RESULTS[0]
    assert (
        result.criterion
        == "File `mocked` should be at least 2 bytes large and should not be larger than 4 bytes."
    )
    assert result.fulfilled == False
    assert result.justification == "File `mocked` has a size of 5 bytes."
