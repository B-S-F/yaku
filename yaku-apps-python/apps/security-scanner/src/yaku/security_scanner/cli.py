from typing import Tuple

from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import ResultsCollector
from yaku.security_scanner.config import load_configuration
from yaku.security_scanner.scanner import SecurityScanner


class CLI:
    click_name = "security-scanner"
    click_help_text = "This app scans a remote git repository for security vulnerabilities. For scanning, it runs Trivy open source scanner for security issues."
    status_red = "RED"
    status_green = "GREEN"
    status_red_message = "{num_of_vulnerabilities} security vulnerabilities with {vulnerability_threshold} severity or higher are found."
    status_green_message = "No security vulnerabilities with {vulnerability_threshold} severity or higher are found."

    @staticmethod
    def click_command():
        configuration = load_configuration()
        scanner = SecurityScanner()

        scanner.scan(configuration=configuration)

    @classmethod
    def click_evaluator_callback(cls, results: ResultsCollector) -> Tuple[str, str]:
        if any([not r.fulfilled for r in results]):
            return (
                cls.status_red,
                cls.status_red_message.format(
                    num_of_vulnerabilities=len(results),
                    vulnerability_threshold=results[0].metadata["vulnerability_threshold"],
                ),
            )
        return (
            cls.status_green,
            cls.status_green_message.format(
                vulnerability_threshold=results[0].metadata["vulnerability_threshold"]
            ),
        )


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)


if __name__ == "__main__":
    main()
