from datetime import datetime

import pytest
import pytz
from freezegun import freeze_time
from yaku.autopilot_utils.checks import (
    contains,
    convert_to_date,
    convert_to_seconds,
    equals,
    larger,
    larger_equal,
    less,
    less_equal,
    not_empty,
    older,
)
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError


def test_not_empty():
    assert not not_empty("")
    assert not not_empty(" ")
    assert not_empty("3.2")
    assert not_empty("text")
    assert not_empty("multiple word sentence")


def test_larger():
    assert larger("3", 2)
    assert not larger("2", 3)
    assert larger("3", "2")
    assert not larger("2", "3")

    with pytest.raises(AutopilotError, match="Could not convert"):
        larger("a", 2)

    # the second value is in our case the one from the config file, so it's a configuration error
    with pytest.raises(AutopilotConfigurationError, match="Could not convert"):
        larger("2", "a")

    with pytest.raises(AutopilotError, match="Could not convert"):
        larger("a", "b")


def test_larger_equal():
    assert larger_equal("3", 2)
    assert not larger_equal("2", 3)
    assert larger_equal("3", "2")
    assert not larger_equal("2", "3")
    # Actual equal
    assert larger_equal("1", 1)
    assert larger_equal("1", "1")

    with pytest.raises(AutopilotError, match="Could not convert"):
        larger_equal("a", 2)

    # the second value is in our case the one from the config file, so it's a configuration error
    with pytest.raises(AutopilotConfigurationError, match="Could not convert"):
        larger_equal("2", "a")

    with pytest.raises(AutopilotError, match="Could not convert"):
        larger_equal("a", "b")


def test_less():
    assert not less("3", 2)
    assert less("2", 3)
    assert not less("3", "2")
    assert less("2", "3")

    with pytest.raises(AutopilotError, match="Could not convert"):
        less("a", 2)

    # the second value is in our case the one from the config file, so it's a configuration error
    with pytest.raises(AutopilotConfigurationError, match="Could not convert"):
        less("2", "a")

    with pytest.raises(AutopilotError, match="Could not convert"):
        less("a", "b")


def test_less_equal():
    assert not less_equal("3", 2)
    assert less_equal("2", 3)
    assert not less_equal("3", "2")
    assert less_equal("2", "3")
    # Actual equal
    assert less_equal("1", 1)
    assert less_equal("1", "1")

    with pytest.raises(AutopilotError, match="Could not convert"):
        less_equal("a", 2)

    # the second value is in our case the one from the config file, so it's a configuration error
    with pytest.raises(AutopilotConfigurationError, match="Could not convert"):
        less_equal("2", "a")

    with pytest.raises(AutopilotError, match="Could not convert"):
        less_equal("a", "b")


def test_equals():
    assert equals("1", 1)
    assert equals("1", "1")

    assert equals("3.", 3)
    assert equals("3.", "3")
    assert equals("3.0", 3)
    assert equals("3.0", "3")
    assert equals("3.00", 3.0)
    assert equals("3.00", "3.0")

    assert not equals("1", 2)
    assert not equals("1", "2")

    assert equals("works on larger strings as well", "works on larger strings as well")
    assert not equals("Case sensitive as well", "case sensitive as well")


@pytest.mark.parametrize(
    ("input", "expected_output"),
    [
        ("15", 15),
        ("15s", 15),
        ("15S", 15),
        ("15 s", 15),
        ("15 seconds", 15),
        ("15 sec", 15),
        ("1m", 60),
        ("1 minutes", 60),
        ("1 minute", 60),
        ("1 h", 3600),
        ("1 hr", 3600),
        ("1 hours", 3600),
        ("1 hour", 3600),
        ("0.5 hours", 1800),
        ("1 d", 86400),
        ("1 day", 86400),
        ("1 days", 86400),
        ("1 w", 604800),
        ("1 week", 604800),
        ("1 weeks", 604800),
        ("1 months", 2628000),
        ("1 M", 2628000),
        ("1 Mo", 2628000),
        ("1 Month", 2628000),
        ("1 Months", 2628000),
        ("1 y", 31536000),
        ("1 years", 31536000),
        ("1 year", 31536000),
        ("1m40s", 100),
        ("1m 40s", 100),
        ("1 m40 s", 100),
        ("1 m 40 s", 100),
        ("1 M 1 m", 2628060),
        ("1 month 1 m", 2628060),
        ("1 month 1 minute", 2628060),
        ("1 months 1 minutes", 2628060),
    ],
)
def test_convert_to_seconds(input, expected_output):
    assert convert_to_seconds(input) == expected_output


@pytest.mark.parametrize(
    ("input", "expected_output"),
    [
        ("2022-01-01", datetime(2022, 1, 1).timestamp()),
        ("2022-01-01T12:34", datetime(2022, 1, 1, 12, 34).timestamp()),
        (
            "2022-01-01T12:34:56.999",
            datetime(2022, 1, 1, 12, 34, 56, 999000).timestamp(),
        ),
        (
            "2022-01-01T12:34:56.999Z",
            datetime(2022, 1, 1, 12, 34, 56, 999000, tzinfo=pytz.UTC).timestamp(),
        ),
    ],
)
def test_convert_to_date(input, expected_output):
    assert convert_to_date(input) == expected_output


@pytest.mark.parametrize(
    ("invalid_input"),
    [
        ("20 €",),
        ("some-invalid-date",),
        (1,),
    ],
    ids=lambda x: str(x),
)
def test_convert_to_date_fails_on_invalid_input(invalid_input):
    with pytest.raises(AutopilotConfigurationError, match="Invalid timestamp"):
        convert_to_date(invalid_input)


def test_contains():
    assert contains("abcd", "b")
    assert not contains("abcd", "B")
    assert contains("abcd", "bc")
    assert contains("123", 2)
    assert contains("123", "2")
    assert not contains("123", 4)


def test_older_against_another_date():
    assert older("2009-01-01", "2010-01-01")
    assert not older("2009-01-01 18:09:01", "2009-01-01 18:09:00")
    assert not older("2009-01-02 18:09:01", "2009-01-01")
    assert not older("2009-01-02", "2009-01-01")


@freeze_time("2010-01-01T00:00Z")
def test_older_against_time_span():
    assert not older(
        "2008-01-01T00:00Z", "2 years 1 day"
    )  # 2008 was a leap year with 366 days
    assert not older("2009-01-01T00:00Z", "1 year")
    assert older("2008-12-31T00:00Z", "1 year")
    assert older("2009-01-01T00:00Z", "364 days")
