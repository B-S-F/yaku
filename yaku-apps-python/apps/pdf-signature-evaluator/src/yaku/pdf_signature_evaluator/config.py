from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, BaseSettings, ValidationError, validator


class ConfigFileContent(BaseModel):
    __root__: List[Dict[str, Any]]

    def __iter__(self):
        return iter(self.__root__)


class ConfigFile(BaseSettings):
    file_path: str = ""
    content: Optional[ConfigFileContent] = None

    @validator("file_path", always=True)
    def validate_path(cls, v: Any):
        if v is None:
            raise ValueError(
                "Config file path is not set. Please set it via the --configuration option or the CONFIGURATION_LOCATION environment variable."
            )
        file_path = Path(v)
        if not file_path.exists():
            raise ValueError(f"Config file {file_path} does not exist.")
        if not file_path.is_file():
            raise ValueError(f"Config file {file_path} is not a file.")
        return file_path

    @validator("content", always=True)
    def read_file(cls, v: Any, values: Dict[str, Any]):
        file_path = values.get("file_path")
        if file_path is None:
            return None
        with file_path.open("r") as f:
            config_data = yaml.safe_load(f)
            if config_data is None:
                raise ValueError(f"Config file `{file_path.name}` is empty!")
        try:
            if isinstance(config_data, dict):
                config_data = [{k: v} for k, v in config_data.items()]
            return ConfigFileContent.parse_obj(config_data)
        except ValidationError as e:
            raise ValueError(f"Invalid config file {file_path}: {e}")
