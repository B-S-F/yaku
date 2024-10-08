import os

from .errors import AutopilotConfigurationError


def require_environment_variable(variable_name: str) -> str:
    """Ensure that an environment variable is there and return its value."""
    value = os.environ.get(variable_name)
    if not value:
        raise AutopilotConfigurationError(
            f"The environment variable {variable_name} is not set!"
        )
    return value
