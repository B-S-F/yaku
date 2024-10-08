import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, BaseSettings, Field, ValidationError, validator


class FileRules(BaseModel):
    file: str
    rules: Optional[List[Dict[str, Any]]] = []


class ConfigFileContent(BaseModel):
    __root__: List[FileRules]

    def __iter__(self):
        return iter(self.__root__)


class ConfigFile(BaseSettings):
    file_path: str = ""
    content: Optional[ConfigFileContent] = None

    def __bool__(self):
        return all(vars(self).values())

    @validator("file_path", always=True)
    def validate_path(cls, v: Any):
        if v is None:
            raise ValueError(
                "Config file path is not set. Please set it via the --config-file option or the SHAREPOINT_EVALUATOR_CONFIG_FILE environment variable."
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
        with values["file_path"].open("r") as f:
            config_data = yaml.safe_load(f)
            if config_data is None:
                raise ValueError(f"Config file `{file_path.name}` is empty!")
        try:
            return ConfigFileContent.parse_obj(config_data)
        except ValidationError as e:
            raise ValueError(f"Invalid config file {values['file_path']}: {e}")


class Settings(BaseSettings):
    evidence_path: Path
    custom_properties: Optional[str] = Field(None)

    @validator("evidence_path", always=True)
    def validate_evidence_path(cls, v: Any):
        return Path(v)

    @validator("custom_properties", always=True)
    def validate_custom_properties(cls, v: Any):
        if v is None or not v.strip():
            return v
        pattern = r"^[^=]+=>[^=]+=>[^=]+$"
        items = [i.strip() for i in v.split("|")]
        for item in items:
            if not re.match(pattern, item):
                raise ValueError(
                    f"Could not parse title mapping: {item}. "
                    "It must have the format PropertyName=>ListTitle=>ListItemTitlePropertyName.",
                )
        return v
