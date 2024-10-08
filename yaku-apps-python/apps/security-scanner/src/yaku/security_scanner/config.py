import os
import re
from dataclasses import dataclass

from yaku.autopilot_utils.errors import AutopilotConfigurationError


@dataclass
class Configuration:
    git_token: str
    git_repo_url: str
    use_private_registry: bool
    private_registry_url: str
    private_registry_token: str
    private_registry_scope: str
    scan_local_repo: bool
    vulnerability_threshold: str


def check_private_registry_variables(private_registry_url: str, private_registry_token: str):
    if not private_registry_url:
        raise AutopilotConfigurationError(
            "If the repository installs packages from a private registry, set PRIVATE_REGISTRY_URL to the registry URL."
        )
    if not private_registry_token:
        raise AutopilotConfigurationError(
            "If the repository installs packages from a private registry, set PRIVATE_REGISTRY_TOKEN to a valid token that has access to the registry."
        )


def load_configuration() -> Configuration:
    git_token = os.environ.get("GIT_TOKEN")
    git_repo_url = os.environ.get("GIT_REPO_URL")
    vulnerability_threshold = os.environ.get("VULNERABILITY_THRESHOLD")
    local_repo_scanner = os.environ.get("LOCAL_REPO_SCANNER", "FALSE").upper() == "TRUE"
    private_registry = os.environ.get("PRIVATE_REGISTRY", "FALSE").upper() == "TRUE"
    private_registry_url = os.environ.get(
        "PRIVATE_REGISTRY_URL", ""
    )  # set default to falsy to avoid typing
    private_registry_token = os.environ.get(
        "PRIVATE_REGISTRY_TOKEN", ""
    )  # set default to falsy to avoid typing
    private_registry_scope = os.environ.get("PRIVATE_REGISTRY_SCOPE", "")

    if not vulnerability_threshold:
        vulnerability_threshold = "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"
    else:
        check_valid_vulnerability_threshold(vulnerability_threshold)

    if not git_token:
        raise AutopilotConfigurationError(
            "Please provide a valid personal access token that has access to the git repo."
        )
    if not git_repo_url:
        raise AutopilotConfigurationError("Please provide a remote git repository URL.")

    if private_registry:
        check_private_registry_variables(private_registry_url, private_registry_token)

    if not re.match(r"^ghp_[a-zA-Z0-9]{36}$", git_token):
        raise AutopilotConfigurationError("The provided GIT_TOKEN is not valid.")

    return Configuration(
        git_token=git_token,
        git_repo_url=git_repo_url,
        use_private_registry=private_registry,
        private_registry_url=private_registry_url,
        private_registry_token=private_registry_token,
        private_registry_scope=private_registry_scope,
        scan_local_repo=local_repo_scanner,
        vulnerability_threshold=vulnerability_threshold,
    )


def check_valid_vulnerability_threshold(vulnerability_threshold: str) -> None:
    valid_vulnerability_thresholds = ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    for threshold in vulnerability_threshold.split(","):
        if threshold not in valid_vulnerability_thresholds:
            raise AutopilotConfigurationError(
                "The provided VULNERABILITY_THRESHOLD is not valid. It should be a comma separated list of UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL."
            )
