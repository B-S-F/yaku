from pathlib import Path
from typing import Any, Dict, List

from loguru import logger

from .splunk.base import (
    SplunkBaseSettings,
    SplunkOneShotSearchSettings,
    SplunkSearchSettings,
)
from .splunk.fetcher import SplunkFetcher

DEFAULT_SLEEP_DURATION = 20
MAX_RETRY_COUNT = 5


def parse_result_filename(_, __, value):
    return Path(value).name


def create_outputs(file_paths: List[Path], oneq_upload: bool = False):
    outputs: List[Dict[str, Any]] = []
    for value in file_paths:
        outputs.append({"output": {"fetched": str(value.resolve())}})
    if oneq_upload:
        outputs.append(
            {
                "output": {
                    "oneqUpload": True,
                    **{value.name: str(value.resolve()) for value in file_paths},
                }
            }
        )
    return outputs


def fetch_splunk_data(
    query: str,
    username: str,
    password: str,
    token: str,
    host: str,
    port: int,
    output_format,
    app: str,
    one_shot: bool,
    start_time,
    end_time,
    validate_results: bool,
):
    client_settings = SplunkBaseSettings(
        app=app, username=username, password=password, token=token, host=host, port=port
    )

    settings = SplunkSearchSettings(query=query, start_time=start_time, end_time=end_time)
    if one_shot:
        settings = SplunkOneShotSearchSettings(
            query=query, start_time=start_time, end_time=end_time
        )
    logger.debug("Initialing SplunkFetcher with {settings}", settings=settings)
    fetcher = SplunkFetcher(client_settings, settings)
    return fetcher.fetch(output_format, validate_results)


def write_output_file(data: str, file_path: Path):
    logger.debug("Writing Splunk data to {path}", path=file_path)
    if not file_path.parent.exists():
        file_path.parent.mkdir(parents=True)
    with open(file_path, "w") as f:
        f.write(data)
