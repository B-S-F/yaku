import pytest
from freezegun import freeze_time
from yaku.autopilot_utils.checks import check
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError


@pytest.mark.parametrize("is_prefix", ["is-", ""])
def test_check_empty_strings(is_prefix):
    assert check("", is_prefix + "empty", "")
    assert check("word", is_prefix + "not-empty", "")


def test_check_compare_strings():
    assert check("abc", "equals", "abc")
    assert not check("1", "equals", "2")


def test_check_string_contains():
    assert check("abc", "contains", "b")
    assert not check("lorem ipsum", "contains", "foo")


@pytest.mark.parametrize("is_prefix", ["is-", ""])
def test_check_compare_numbers(is_prefix):
    assert check("2", is_prefix + "less-than", 5)
    assert not check("8", is_prefix + "less-than", 5)
    assert check("2.5", is_prefix + "less-than", 5.1)
    assert not check("5.5", is_prefix + "less-than", 5.1)

    assert check("2", is_prefix + "less-equal-than", 5)
    assert not check("8", is_prefix + "less-equal-than", 5)
    assert check("2.5", is_prefix + "less-equal-than", 5.1)
    assert not check("5.5", is_prefix + "less-equal-than", 5.1)

    assert check(".2", is_prefix + "less-equal-than", 0.2)
    assert check(".2", is_prefix + "less-equal-than", ".2")
    assert check(".2", is_prefix + "less-equal-than", 0.2)
    assert check(".2", is_prefix + "less-equal-than", "0.2")
    assert check("0.2", is_prefix + "less-equal-than", 0.2)
    assert check("0.2", is_prefix + "less-equal-than", ".2")
    assert check("0.2", is_prefix + "less-equal-than", 0.2)
    assert check("0.2", is_prefix + "less-equal-than", "0.2")

    assert not check("2", is_prefix + "larger-than", 5)
    assert check("8", is_prefix + "larger-than", 5)
    assert not check("2.5", is_prefix + "larger-than", 5.1)
    assert check("5.5", is_prefix + "larger-than", 5.1)

    assert check(".2", is_prefix + "larger-equal-than", 0.2)
    assert check(".2", is_prefix + "larger-equal-than", ".2")
    assert check(".2", is_prefix + "larger-equal-than", 0.2)
    assert check(".2", is_prefix + "larger-equal-than", "0.2")
    assert check("0.2", is_prefix + "larger-equal-than", 0.2)
    assert check("0.2", is_prefix + "larger-equal-than", ".2")
    assert check("0.2", is_prefix + "larger-equal-than", 0.2)
    assert check("0.2", is_prefix + "larger-equal-than", "0.2")


def test_check_compare_invalid_numbers():
    with pytest.raises(AutopilotError):
        check("text", "is-less-than", 5)


def test_check_date_compare_integer_number_with_date():
    with pytest.raises(AutopilotError, match="is not a valid date"):
        check(1, "older-than", "2001-01-01")  # type: ignore


@freeze_time("2010-01-01T00:00:00Z")
def test_check_date_with_just_a_number():
    assert check("2010-01-01T00:00:00Z", "older-than", -1)
    assert check("2010-01-01T00:00:00Z", "older-than", -0.0001)
    assert not check("2010-01-01T00:00:00Z", "older-than", 0)
    assert not check("2010-01-01T00:00:00Z", "older-than", 1)


@pytest.mark.parametrize("is_prefix", ["is-", ""])
def test_check_date_comparison_against_fix_date(is_prefix):
    assert check("2000-01-01", is_prefix + "older-than", "2001-01-01")
    assert not check("2002-01-01", is_prefix + "older-than", "2001-01-01")
    # and now the inverse condition
    assert not check("2000-01-01", is_prefix + "not-older-than", "2001-01-01")
    assert check("2000-01-01", is_prefix + "not-older-than", "1999-01-01")


@freeze_time("2010-01-01")
@pytest.mark.parametrize("is_prefix", ["is-", ""])
def test_check_date_comparison_against_time_span(is_prefix):
    assert check("2000-01-01", is_prefix + "older-than", "1 year")
    assert not check("2020-01-01", is_prefix + "older-than", "1 year")
    assert not check("2009-01-02", is_prefix + "older-than", "1 year")
    # and now the inverse condition
    assert not check("2000-01-01", is_prefix + "not-older-than", "1 year")
    assert check("2020-01-01", is_prefix + "not-older-than", "1 year")
    assert check("2009-01-02", is_prefix + "not-older-than", "1 year")


def test_invalid_operator():
    with pytest.raises(AutopilotConfigurationError, match="Invalid operator"):
        check("something", "invalid-operator", "something else")
