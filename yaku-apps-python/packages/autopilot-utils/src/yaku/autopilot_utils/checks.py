import re
from datetime import datetime
from functools import wraps
from typing import Any, Protocol

import dateutil.parser
import pytz

from .errors import AutopilotConfigurationError, AutopilotError

OtherValue = str | int | float


class CheckFunctionType(Protocol):
    def __call__(self, checked_value: str, other_value: OtherValue | None = None) -> bool:
        pass


class NiceCheckFunctionType(CheckFunctionType):
    _nice: str


def make_nice(func: Any) -> NiceCheckFunctionType:
    """
    Provide some dummy decorator for mypy.

    See https://github.com/python/mypy/issues/2087#issuecomment-462726600 for explanation.
    """
    return func  # type: ignore


@make_nice
def equals(checked_value: str, other_value: OtherValue) -> bool:
    """Check whether `checked_value` and `other_value` are equal."""
    try:
        checked_value_number = float(checked_value)
        other_value_number = float(other_value)
        return checked_value_number == other_value_number
    except ValueError:
        return str(checked_value) == (str(other_value))


equals._nice = "is equal to"


def expect_first_arg_to_be_convertible_to_float(f):
    @wraps(f)
    def wrapper(some_arg, *args, **kwargs):
        try:
            float_arg = float(some_arg)
        except ValueError as e:
            raise AutopilotError(f"Could not convert `{some_arg}` to a number!") from e
        return f(float_arg, *args, **kwargs)

    return wrapper


@make_nice
@expect_first_arg_to_be_convertible_to_float
def larger(checked_value: float, other_value: OtherValue) -> bool:
    """Check if `checked_value` is larger than `other_value`."""
    try:
        return checked_value > float(other_value)
    except ValueError as e:
        raise AutopilotConfigurationError(
            f"Could not convert `{other_value}` to a number!"
        ) from e


larger._nice = "is larger than"


@make_nice
@expect_first_arg_to_be_convertible_to_float
def larger_equal(checked_value: float, other_value: OtherValue) -> bool:
    """Check if `checked_value` is larger-equal than `other_value`."""
    try:
        return checked_value >= float(other_value)
    except ValueError as e:
        raise AutopilotConfigurationError(
            f"Could not convert `{other_value}` to a number!"
        ) from e


larger_equal._nice = "is larger than or equal to"


@make_nice
@expect_first_arg_to_be_convertible_to_float
def less(checked_value: float, other_value: OtherValue) -> bool:
    """Check if `checked_value` is less than `other_value`."""
    try:
        return checked_value < float(other_value)
    except ValueError as e:
        raise AutopilotConfigurationError(
            f"Could not convert `{other_value}` to a number!"
        ) from e


less._nice = "is less than"


@make_nice
@expect_first_arg_to_be_convertible_to_float
def less_equal(checked_value: float, other_value: OtherValue) -> bool:
    """Check if `checked_value` is less-equal than `other_value`."""
    try:
        return checked_value <= float(other_value)
    except ValueError as e:
        raise AutopilotConfigurationError(
            f"Could not convert `{other_value}` to a number!"
        ) from e


less_equal._nice = "is less than or equal to"


SECONDS_PER_UNIT = {
    "second": 1,
    "minute": 60,
    "hour": 3600,
    "day": 86400,
    "week": 604800,
    "month": 2628000,
    "year": 31536000,
    "s": 1,
    "S": 1,
    "m": 60,
    "h": 3600,
    "d": 86400,
    "w": 604800,
    "M": 2628000,
    "y": 31536000,
}


def convert_to_date(timestamp):
    try:
        if "-" in timestamp or ":" in timestamp:
            try:
                date = dateutil.parser.parse(timestamp)
            except dateutil.parser.ParserError:
                date = None
            if date is not None:
                return date.astimezone(tz=pytz.utc).timestamp()
        else:
            try:
                convert_to_seconds(timestamp)
                return None  # this case of an interval is handled by other functions!
            except Exception:
                raise AutopilotConfigurationError(
                    f"Invalid timestamp: {timestamp}. Must be given as yyyy-mm-dd, "
                    "or as a full timestamp like yyyy-mm-ddThh:mm:ss.sssZ (T and Z are fix!)"
                )
    except TypeError:
        return None


def convert_to_seconds(timestamp: str) -> float:
    timestamp = timestamp.replace(" ", "")
    seconds: float = 0
    units_pattern = "|".join(SECONDS_PER_UNIT.keys())
    found_at_least_one_pattern = False
    for item in re.finditer(
        r"(?P<value>-?\d+(\.\d+)?)(?P<unit>(" + units_pattern + ")?)", timestamp
    ):
        seconds += SECONDS_PER_UNIT.get(item.group("unit"), 1) * float(item.group("value"))
        found_at_least_one_pattern = True

    assert found_at_least_one_pattern, f"Could not parse {timestamp} into seconds!"
    return seconds


@make_nice
def older(checked_value: str, other_value: OtherValue) -> bool:
    some_date = convert_to_date(checked_value)
    if some_date is None:
        raise AutopilotError(
            f"The value '{checked_value}' is not a valid date and cannot be used for comparison!"
        )
    other_date = convert_to_date(other_value)
    if other_date is None:
        other_time_interval = convert_to_seconds(str(other_value))
        current_timestamp = datetime.today().timestamp()
        return bool(some_date < current_timestamp - other_time_interval)
    else:
        return bool(some_date < other_date)


older._nice = "is older than"


@make_nice
def not_older(checked_value: str, other_value: OtherValue) -> bool:
    return not older(checked_value, other_value)


not_older._nice = "is not older than"


@make_nice
def empty(checked_value: str, _=None) -> bool:
    return not not_empty(checked_value)


empty._nice = "is empty"


@make_nice
def not_empty(checked_value: str, _=None) -> bool:
    """Check if `checked_value` is not empty or a blank space."""
    return bool(checked_value and str(checked_value).strip())


not_empty._nice = "is not empty"


@make_nice
def contains(checked_value: str, other_value: OtherValue) -> bool:
    """Check if `checked_value` contains `other_value`."""
    return str(other_value) in str(checked_value)


contains._nice = "contains"

checks_dict: dict[str, NiceCheckFunctionType] = {
    "contains": contains,
    "empty": empty,
    "equal": equals,
    "equals": equals,
    "is-empty": empty,
    "is-equal": equals,
    "is-larger": larger,
    "is-larger-equal": larger_equal,
    "is-larger-equal-than": larger_equal,
    "is-larger-than": larger,
    "is-less": less,
    "is-less-equal": less_equal,
    "is-less-equal-than": less_equal,
    "is-less-than": less,
    "is-more": larger,
    "is-more-than": larger,
    "is-not-empty": not_empty,
    "is-not-older": not_older,
    "is-not-older-than": not_older,
    "is-older": older,
    "is-older-than": older,
    "larger": larger,
    "larger-equal": larger_equal,
    "larger-equal-than": larger_equal,
    "larger-than": larger,
    "less": less,
    "less-equal": less_equal,
    "less-equal-than": less_equal,
    "less-than": less,
    "more": larger,
    "more-than": larger,
    "not-empty": not_empty,
    "not-older": not_older,
    "not-older-than": not_older,
    "older": older,
    "older-than": older,
}


def invalid_operator(checked_value: str, other_value: OtherValue | None) -> bool:
    raise AutopilotConfigurationError(
        f"Invalid operator: for operands '{checked_value}' and '{other_value}'"
    )


def check(
    checked_value: str,
    operator: str,
    other_value: OtherValue | None,
) -> bool:
    """
    Validate a value.

    Takes the `checked_value`, applies a (binary or unary) `operator`
    with the `other_value` and evaluates the expression.
    """
    check_result = checks_dict.get(operator, invalid_operator)(checked_value, other_value)

    return check_result
