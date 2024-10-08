from time import sleep
from typing import Any, Dict, Optional

from dateutil.parser import parse
from loguru import logger
from pydantic import BaseSettings, Field, validator
from splunklib import binding, client, results
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError

from .result import SplunkResult


class SplunkBaseSettings(BaseSettings):
    app: str = Field(..., env="SPLUNK_APP")
    username: Optional[str] = Field(..., env="SPLUNK_USERNAME")
    password: Optional[str] = Field(..., env="SPLUNK_PASSWORD")
    token: Optional[str] = Field(..., env="SPLUNK_TOKEN")
    host: str = Field(..., env="SPLUNK_HOST")
    port: int = Field(8089, env="SPLUNK_PORT")

    @validator("port", always=True)
    def validate_port(cls, v):
        return int(v)


class SplunkSearchSettings(BaseSettings):
    query: str = Field(..., env="SPLUNK_QUERY")
    parallel_job_limit: int = Field(3)
    poll_interval: int = Field(5)
    timeout: int = Field(20 * 60)
    start_time: str = Field("", env="SPLUNK_START_TIME")
    end_time: str = Field("", env="SPLUNK_END_TIME")

    @validator("start_time", always=True)
    def validate_start_time(cls, v):
        try:
            return parse(v).isoformat()
        except ValueError:
            raise AutopilotConfigurationError("Invalid date time passed for start_time")

    @validator("end_time", always=True)
    def validate_end_time(cls, v):
        try:
            return parse(v).isoformat()
        except ValueError:
            raise AutopilotConfigurationError("Invalid date time passed for end_time")


class SplunkOneShotSearchSettings(SplunkSearchSettings):
    query: str = Field(..., env="SPLUNK_QUERY")
    start_time: str = Field("", env="SPLUNK_START_TIME")
    end_time: str = Field("", env="SPLUNK_END_TIME")

    @validator("start_time", always=True)
    def validate_start_time(cls, v):
        try:
            return parse(v).isoformat()
        except ValueError:
            raise AutopilotConfigurationError("Invalid date time passed for start_time")

    @validator("end_time", always=True)
    def validate_end_time(cls, v):
        try:
            return parse(v).isoformat()
        except ValueError:
            raise AutopilotConfigurationError("Invalid date time passed for end_time")


class SplunkBase(object):
    def __init__(
        self,
        config: SplunkBaseSettings,
    ):
        if config.token:
            self.service = client.connect(
                splunkToken=config.token,
                app=config.app,
                host=config.host,
                port=config.port,
                autologin=True,
            )
        else:
            self.service = client.connect(
                username=config.username,
                password=config.password,
                app=config.app,
                host=config.host,
                port=config.port,
            )

    def search(
        self,
        settings: SplunkSearchSettings | SplunkOneShotSearchSettings,
    ) -> SplunkResult:
        retry_interval = 20
        if not issubclass(type(settings), SplunkSearchSettings):
            raise ValueError("Invalid search settings passed")
        self._check_search(settings.query)
        self._ensure_parallel_search_limitation(settings.parallel_job_limit, retry_interval)
        if isinstance(settings, SplunkOneShotSearchSettings):
            return self._one_shot_search(settings)
        if isinstance(settings, SplunkSearchSettings):
            return self._dispatched_search(settings)
        raise AutopilotError("Search type could not be identified")

    def stats(self):
        if self.job:
            return self._get_job_stats(self.job)
        raise AutopilotError(
            "Job stats are not available, either there is no job running or oneshot search was used"
        )

    def _check_search(self, search_query: str) -> None:
        logger.info("Validating search query ...")
        try:
            self.service.parse(search_query, parse_only=True)
            logger.info("Search query is valid")
        except binding.HTTPError as e:
            raise NameError(e)

    def _get_job_stats(self, job) -> Dict[str, Any]:
        stats = {
            "isDone": job["isDone"],
            "doneProgress": float(job["doneProgress"]),
            "scanCount": int(job["scanCount"]),
            "eventCount": int(job["eventCount"]),
            "resultCount": int(job["resultCount"]),
        }
        return stats

    def _dispatched_search(self, settings: SplunkSearchSettings) -> SplunkResult:
        logger.info("Dispatching Splunk search ...")
        self.job = self.service.jobs.create(
            settings.query,
            earliest_time=settings.start_time,
            latest_time=settings.end_time,
        )
        poll_count = 0
        while True:
            while not self.job.is_ready():
                sleep(settings.poll_interval)
                if poll_count * settings.poll_interval > settings.timeout:
                    raise TimeoutError("Splunk job is not ready")
                poll_count += 1
            stats = self._get_job_stats(self.job)
            progress: float = stats["doneProgress"] * 100
            scanned: int = stats["scanCount"]
            matched: int = stats["eventCount"]
            res: int = stats["resultCount"]
            logger.debug(
                f"\r{progress:03.1f}% | {scanned} scanned | {matched} matched | {res} results"
            )
            if stats["isDone"] == "1":
                break
            sleep(settings.poll_interval)
            if poll_count * settings.poll_interval > settings.timeout:
                raise TimeoutError("Splunk search job exceeded timeout")
            poll_count += 1
        # Each ResponseReader needs to have an own instance, as it will be emptied after a read() call
        reader = results.JSONResultsReader(self.job.results(output_mode="json", count=0))
        csv = self.job.results(output_mode="csv", count=0)
        json = self.job.results(output_mode="json", count=0)
        self.job.cancel()
        try:
            # Overrides have to be added,
            # as the results in the reader do not contain empty columns, which are expected so far
            return SplunkResult(reader, override_csv=csv.read(), override_json=json.read())
        except ValueError:
            raise AutopilotError("Failed to parse splunk result")

    def _one_shot_search(self, settings: SplunkOneShotSearchSettings) -> SplunkResult:
        logger.info("Executing Splunk oneshot search ...")
        reader = results.JSONResultsReader(
            self.service.jobs.oneshot(
                settings.query,
                output_mode="json",
                earliest_time=settings.start_time,
                latest_time=settings.end_time,
                count=0,
            )
        )
        if reader.is_preview:
            raise AutopilotError("Oneshot search returned a invalid result")
        try:
            return SplunkResult(reader)
        except ValueError:
            raise AutopilotError("Failed to parse splunk result")

    def _ensure_parallel_search_limitation(self, job_limit: int, poll_duration: int) -> None:
        logger.info("Ensuring Splunk parallel search limitation...")
        poll_count: int = 0
        running_jobs: int = self._get_number_of_jobs()
        exit_duration: int = 2 * 60
        while running_jobs >= job_limit:
            if poll_count * poll_duration > exit_duration:
                logger.info("Waited for ~2 minutes, trying to run the query now")
                break
            logger.debug(f"Running jobs: {running_jobs}, parallel search limit: {job_limit}")
            sleep(poll_duration)
            running_jobs = self._get_number_of_jobs()
            poll_count += 1

    def _get_number_of_jobs(self) -> int:
        return len(self.service.jobs.list(search="done=false"))
