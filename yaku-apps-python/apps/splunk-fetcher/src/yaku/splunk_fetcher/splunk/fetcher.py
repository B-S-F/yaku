from time import sleep

from loguru import logger
from splunklib import binding, results
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotFailure

from .base import (
    SplunkBase,
    SplunkBaseSettings,
    SplunkOneShotSearchSettings,
    SplunkSearchSettings,
)
from .result import SplunkResult


class SplunkFetcher:
    def __init__(
        self,
        client_settings: SplunkBaseSettings,
        search_settings: SplunkSearchSettings | SplunkOneShotSearchSettings,
        max_retry_count=5,
    ):
        self.search_settings = search_settings
        self.splunk = SplunkBase(client_settings)
        self.max_retry_count = max_retry_count

    def fetch(self, output_format: str, validate_results: bool = False):
        logger.info("Fetching Splunk data ...")
        search_result = self._execute_retry_search()
        actual_number_of_results = len(search_result)
        logger.debug(f"received {actual_number_of_results} results")
        if validate_results:
            logger.info("Validating amount of results")
            expected_number_of_results = -1
            try:
                stats = self.splunk.stats()
                expected_number_of_results = stats["resultCount"]
            except (ValueError, KeyError) as e:
                raise AutopilotFailure(f"Result validation failed with {e}")
            if actual_number_of_results != expected_number_of_results:
                raise AutopilotFailure(
                    f"Expected {expected_number_of_results} results, but got {actual_number_of_results}"
                )
            else:
                logger.info(
                    f"Validation succeeded: the number of retrieved results ({actual_number_of_results}) matched the expected ({expected_number_of_results})"
                )
        return self._transform_results(search_result, output_format)

    def _execute_retry_search(self, poll_interval: int = 20) -> results.JSONResultsReader:
        for _ in range(self.max_retry_count + 1):
            try:
                return self.splunk.search(self.search_settings)
            except binding.HTTPError as e:
                if e.status == 503:
                    logger.debug("Splunk is not reachable ... retrying")
                    sleep(poll_interval)
                else:
                    raise AutopilotFailure(e.message)
        raise AutopilotFailure("Fetch failed with maximum retries exceeded")

    def _transform_results(self, result: SplunkResult, output_format: str) -> str:
        logger.info(f"Transforming results to {output_format}")
        if output_format == "json":
            return result.to_json()
        if output_format == "csv":
            return result.to_csv()
        raise AutopilotConfigurationError(f"Output format {output_format} is not supported")
