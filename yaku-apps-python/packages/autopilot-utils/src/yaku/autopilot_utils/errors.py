__all__ = [
    "AutopilotConfigurationError",
    "AutopilotError",
    "AutopilotException",
    "AutopilotFailure",
    "AutopilotFileNotFoundError",
    "EnvironmentVariableError",
    "FileNotFoundError",
]

"""
There are two main types of exception classes:

AutopilotException (used for wrapping internal failures into more helpful error messages)
- AutopilotError

AutopilotFailure (for all errors which the user might be able to resolve, e.g. configuration mistakes)
- AutopilotConfigurationError
- EnvironmentVariableError
- AutopilotFileNotFoundError
- FileNotFoundError
"""


class AutopilotFailure(Exception):
    """
    Base class for all autopilot failures.

    Will immediately exit the command line invocation and print
    out a 'FAILED' status with the given reason.
    (this is implemented in yaku.autopilot_utils.cli_base)

    Will not print out a stack trace as normal exceptions.
    (this is implemented in yaku.autopilot_utils.cli_base)
    """

    def __init__(self, reason: str):
        self._reason = reason


class AutopilotConfigurationError(AutopilotFailure):
    """Errors related to autopilot configuration."""


class EnvironmentVariableError(AutopilotFailure):
    """Errors related to environment variables."""


class AutopilotFileNotFoundError(AutopilotFailure):
    """A required file is not found."""


class FileNotFoundError(AutopilotFailure):
    """
    A required file is not found.

    Deprecated: use `AutopilotFileNotFoundError` instead.
    """


class AutopilotException(Exception):
    """
    Base class for all autopilot errors.

    Those errors are not treated differently than normal Python exceptions.
    This base class is just there so that developers can use it to wrap
    other (built-in) exceptions into a custom exception with a custom
    error message.
    """


class AutopilotError(AutopilotException):
    """
    Exception for (more or less) unexpected autopilot errors.

    For example can be used to annotate builtin exceptions
    with extra message, e.g.:

        try:
            ...
        except Exception as e:
            raise AutopilotError("During ..., an error occurred!") from e
    """
