import json
import os
import shutil
import subprocess
from tempfile import TemporaryDirectory

from loguru import logger
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.autopilot_utils.results import RESULTS, Result
from yaku.security_scanner.config import Configuration


class SecurityScanner:
    result_criterion = "There are no open vulnerabilities"

    def scan(self, configuration: Configuration) -> None:
        result_file = "security-scanner-result.json"
        git_auth_url = configuration.git_repo_url.replace(
            "https://", f"https://{configuration.git_token}@"
        )

        self.check_git_remote(git_auth_url, configuration.git_repo_url)

        env = os.environ.copy()
        env["GITHUB_TOKEN"] = configuration.git_token

        if not configuration.scan_local_repo:
            self.run_trivy(
                configuration.git_repo_url,
                env,
                configuration.vulnerability_threshold,
                result_file,
            )
        else:
            with TemporaryDirectory() as tmp_folder_name:
                self.clone_repo(configuration.git_repo_url, tmp_folder_name, git_auth_url, env)

                if not os.path.isfile(tmp_folder_name + "/package.json"):
                    raise AutopilotError(
                        "Can't start local scanning as no NPM package.json was found on root level of this repo. Please set LOCAL_REPO_SCANNER to FALSE"
                    )

                if configuration.use_private_registry:
                    self.set_private_registry_credentials(
                        configuration.private_registry_url,
                        configuration.private_registry_token,
                        configuration.private_registry_scope,
                    )

                self.install_npm_dependencies(tmp_folder_name, env)

                self.run_trivy(
                    tmp_folder_name, env, configuration.vulnerability_threshold, result_file
                )

        # if result file does not exist, raise an exception
        if not os.path.isfile(result_file):
            raise AutopilotError(f"Scanning failed, {result_file} doesn't exist")

        # process vulnerabilities
        self.process_vulnerabilities(result_file, configuration.vulnerability_threshold)

    def check_git_remote(self, git_auth_url: str, git_repo_url: str):
        env = {"GIT_TERMINAL_PROMPT": "0"}

        process = subprocess.run(
            ["git", "ls-remote", git_auth_url, "-q"], env=env, encoding="utf-8"
        )
        if process.returncode != 0:
            raise AutopilotConfigurationError(
                f"Can't start scanning, git failed with error code {process.returncode}. Either the provided {git_repo_url} is not a valid URL, or the provided GIT_TOKEN may lack proper SSO configuration to access the required organization.\n\n {process.stderr}"
            )

    def run_trivy(
        self, git_repo_location: str, env: dict, vulnerability_threshold: str, result_file: str
    ) -> str:
        logger.info("Running trivy on {} ...", git_repo_location)
        if git_repo_location.startswith("https://"):
            process = subprocess.run(
                [
                    "trivy",
                    "repository",
                    git_repo_location,
                    "--severity",
                    vulnerability_threshold,
                    "-q",
                    "--format",
                    "json",
                    "-o",
                    result_file,
                ],
                env=env,
                encoding="utf-8",
            )
        else:
            process = subprocess.run(
                [
                    "trivy",
                    "filesystem",
                    "./" + git_repo_location,
                    "--severity",
                    vulnerability_threshold,
                    "-q",
                    "--format",
                    "json",
                    "-o",
                    result_file,
                ],
                env=env,
                encoding="utf-8",
            )

        if process.returncode != 0:
            raise AutopilotError(
                f"Trivy run failed with error code {process.returncode}. \n\n {process.stderr}"
            )

        logger.info("Trivy run completed successfully")
        return result_file

    def install_npm_dependencies(self, tmp_folder_name: str, env: dict) -> None:
        logger.info("Installing npm dependencies ...")
        process = subprocess.run(
            ["npm", "ci", "-ws", "--silent"], cwd=tmp_folder_name, env=env
        )
        if process.returncode != 0:
            raise AutopilotError("Can't install npm dependencies")

    def clone_repo(
        self, git_repo_url: str, tmp_folder_name: str, git_auth_url: str, env: dict
    ) -> None:
        logger.info("Cloning {} ...", git_repo_url)

        if os.path.exists(tmp_folder_name):
            shutil.rmtree(tmp_folder_name)

        process = subprocess.run(["git", "clone", git_auth_url, tmp_folder_name], env=env)
        if process.returncode != 0:
            raise AutopilotError(
                "Can't clone the repo, try again with LOCAL_REPO_SCANNER set to FALSE"
            )

    def set_private_registry_credentials(
        self,
        private_registry_url: str,
        private_registry_token: str,
        private_registry_scope: str,
    ) -> None:
        logger.info("Setting private registry credentials ...")
        # update current users .npmrc file with private registry details
        registry_config = f"registry={private_registry_url}"

        if private_registry_scope:
            registry_config = f"{private_registry_scope}:registry={private_registry_url}"

        with open(os.path.expanduser("~/.npmrc"), "w") as f:
            registry_url_no_proto = private_registry_url.replace("https://", "")
            f.write(
                f"{registry_config}\n//{registry_url_no_proto}/:_authToken={private_registry_token}"
            )

    def process_vulnerabilities(self, result_file: str, vul_severity: str) -> None:
        with open(result_file) as f:
            data = json.load(f)

            if "Results" not in data or len(data["Results"][0]["Vulnerabilities"]) == 0:
                logger.info(
                    f"No security vulnerabilities with {vul_severity} severity or higher are found."
                )
                RESULTS.append(
                    Result(
                        criterion=self.result_criterion,
                        fulfilled=True,
                        justification=f"No security vulnerabilities with {vul_severity} severity or higher are found.",
                        metadata={"vulnerability_threshold": vul_severity},
                    )
                )

                return

            vulnerabilities = data["Results"][0]["Vulnerabilities"]
            for vulnerability in vulnerabilities:
                finding = Result(
                    criterion=self.result_criterion,
                    fulfilled=False,
                    justification=vulnerability["Title"],
                    metadata={
                        "package": vulnerability["PkgName"],
                        "severity": vulnerability["Severity"],
                        "description": vulnerability["Description"],
                        "installedVersion": vulnerability["InstalledVersion"],
                        "vulnerability_threshold": vul_severity,
                    },
                )
                RESULTS.append(finding)

            logger.info(
                f"Found {len(RESULTS)} security vulnerabilities with {vul_severity} severity or higher."
            )
