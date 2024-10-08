from pathlib import Path
from typing import Optional

import yaml
from loguru import logger
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.autopilot_utils.results import Result
from yaku.pdf_signature_evaluator.signer_utils import parse_real_signers


class SignatureComparison:
    r"""
    A class to extract and interact with expected signers.

    Within the constructor the yaml file is opened and read. An instance of this class contains
    information about the expected signers for a file as well as the applicable comparison logic,
    either one- or all signers to be in file.

    :parameter str file_path: The path to the expected signers yaml.

    Logic Identifier
    ________________
    one-of >> At least one of the expected signatures has signed the pdf file.\n

    all-of >>  All expected signers have signed the pdf file.
    """

    results: list[Result]

    def __init__(self, file_path: Optional[Path]):
        self.results = []
        self.file_path = file_path
        try:
            if not file_path:
                self.__parsed_yaml = dict()
                return

            with open(file_path) as stream:
                self.__parsed_yaml = yaml.safe_load(stream)

        except (FileNotFoundError, TypeError):
            logger.exception(f"File {file_path} not found.")
            self.__parsed_yaml = dict()

    def validate_file_type(self, path: Path, expected_type: str, verbose: bool = False) -> str:
        """
        Check if the path has the expected type or assumes that type if the specified path has no extension.

        :param path: The path to the file that is supposed to be checked.
        :param expected_type: The expected file type.
        :return: The path to the file if the file type is correct
            or the path to the file with the expected format appended if the file had no type.
            Returns nothing if the file path does not match the expected type.

        """
        if path.suffix == f".{expected_type}":
            return str(path)
        elif path.suffix == "":
            # Avoid breaking changes with previous configurations which might have not set the file extension
            if verbose:
                logger.warning(
                    f"Configurations containing file names which do not include extensions will be deprecated. Please change the file name in the configuration file from {path} to {path}.{expected_type}."
                )
            return str(path.with_suffix(f".{expected_type}"))
        else:
            raise AutopilotConfigurationError(
                f"File {path} does not match the expected file type {expected_type}"
            )

    def get_expected_signers(self) -> dict[str, list]:
        """
        Parse the expected signers from the yaml file.

        :return: A dictionary that contains file names as keys and a corresponding list of expected
            signers as values.
        """
        expected_signers = {}
        for key, value in self.__parsed_yaml.items():
            key = self.validate_file_type(Path(key), "pdf", True)
            if not isinstance(value, (dict, list)):
                raise AutopilotConfigurationError(
                    f"Expected signers for document {key} are not in the correct format. Check the corresponding keys or format of signers"
                )
            if isinstance(value, dict) and "signers" in value:
                expected_signers[key] = value["signers"]
            elif isinstance(value, list):
                expected_signers[key] = value

        return expected_signers

    def get_operators(self) -> dict[str, str]:
        """
        Parse the operators from the yaml file.

        :return:  A dictionary that contains file names as key and the corresponding logic as value.
            In case a file does not have a logic identifier set, the "all-of" logic will apply.
        """
        operators = {}
        for key, value in self.__parsed_yaml.items():
            key = self.validate_file_type(Path(key), "pdf")
            current_operator = value.get("operator") if isinstance(value, dict) else None
            if current_operator and current_operator.lower() == "one-of":
                operators[key] = "one-of"
            else:
                operators[key] = "all-of"
        return operators

    def get_results(self) -> list[Result]:
        return self.results

    def validate_expected_signers(self, real_signers: dict[str, list]) -> bool:
        r"""
        Compare the given dictionary of real signers with the expected signers.

            (1). It checks if all files that are expected to be signed are part of the real signers'
            dictionary.

            (2). The expected signers lists will be compared with the corresponding real signers lists.
            The result of each check (bool) will be added to the results list.
        :param dict real_signers: A dictionary that holds the file names as well as a list
            of signers for each file
        :return: The bool for all items of the result's list will be returned. In case all results
            in this list are true the return value will be **True** and if one or more items are False,
            the return value will be **False**
        """
        real_signers = parse_real_signers(real_signers)
        expected_signers = self.get_expected_signers()
        operators = self.get_operators()
        logger.debug(f"expected signers: {expected_signers}")
        logger.debug(f"real signers: {real_signers}")
        logger.debug(f"operators: {operators}")

        result_list = []

        for file_name, expected_signers_names in expected_signers.items():
            if file_name not in real_signers:
                result_list.append(False)
                self.results.append(
                    Result(
                        criterion=f"File {file_name} must be available.",
                        fulfilled=False,
                        justification=f"{file_name} not present",
                    )
                )

            elif operators[file_name] == "one-of":
                available_signatures = any(
                    signature in real_signers[file_name]
                    for signature in expected_signers_names
                )
                result_list.append(available_signatures)

                self.results.append(
                    Result(
                        criterion=f"At least one of the expected signers {str(expected_signers_names)} must be found in the file.",
                        fulfilled=available_signatures,
                        justification=f"{'At least one' if available_signatures else 'None'} of the expected signers are found for document {file_name}",
                    )
                )

            elif operators[file_name] == "all-of":
                available_signatures = all(
                    signature in real_signers[file_name]
                    for signature in expected_signers_names
                )
                result_list.append(available_signatures)

                self.results.append(
                    Result(
                        criterion=f"All of the expected signers {str(expected_signers_names)} must be found in the file.",
                        fulfilled=available_signatures,
                        justification=f"{'All' if available_signatures else 'Not all'} of the expected signers are found for document {file_name}",
                    )
                )

        return all(result_list)
