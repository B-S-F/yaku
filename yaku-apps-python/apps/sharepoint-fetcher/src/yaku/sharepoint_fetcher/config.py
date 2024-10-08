import ipaddress
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import unquote, urlparse

import yaml
from pydantic import BaseModel, BaseSettings, Field, ValidationError, validator
from yaku.autopilot_utils.errors import AutopilotConfigurationError


class FileSelection(BaseModel):
    files: str
    title: Optional[str]
    select: Optional[List[Dict[str, Any]]] = []
    onlyLastModified: Optional[bool]


class ConfigFileContent(BaseModel):
    __root__: List[FileSelection]

    def __iter__(self):
        return iter(self.__root__)


class ConfigFile(BaseSettings):
    file_path: Optional[str] = None
    content: Optional[ConfigFileContent] = None

    def __bool__(self):
        return all(vars(self).values())

    @validator("file_path", always=True)
    def validate_path(cls, v: Any):
        if v is None:
            return None
        file_path = Path(v)
        if not file_path.exists():
            raise AutopilotConfigurationError(f"Config file {file_path} does not exist.")
        if not file_path.is_file():
            raise AutopilotConfigurationError(f"Config file {file_path} is not a file.")
        return file_path

    @validator("content", always=True)
    def read_file(cls, v: Any, values: Dict[str, Any]):
        file_path = values.get("file_path")
        if file_path is None:
            return None
        with values["file_path"].open("r") as f:
            config_data = yaml.safe_load(f)
        try:
            return ConfigFileContent.parse_obj(config_data)
        except ValidationError as e:
            raise AutopilotConfigurationError(
                f"Invalid config file {values['file_path']}: {e}"
            )


class Settings(BaseSettings):
    destination_path: Path
    is_cloud: Optional[bool] = False
    sharepoint_path: Optional[str] = Field(None)
    sharepoint_site: Optional[str] = Field(None)
    sharepoint_url: Optional[str] = Field(None)
    username: Optional[str] = Field(None)
    password: Optional[str] = Field(None)
    tenant_id: Optional[str] = Field(None)
    client_id: Optional[str] = Field(None)
    client_secret: Optional[str] = Field(None)
    force_ip: Optional[str] = Field(None)
    custom_properties: Optional[str] = Field(None)
    download_properties_only: Optional[bool] = False
    sharepoint_file: Optional[str] = Field(None)

    def require_env_var(cls, v, values, config, field):
        if not v:
            raise AutopilotConfigurationError(
                f"Missing required environment variable {field.field_info.extra['env']}"
            )
        return v

    @validator("sharepoint_url", always=True)
    def validate_sharepoint_url(cls, v: Any, values: Dict[str, Any]):
        if v is None:
            return v

        sharepoint_site = values.get("sharepoint_site")
        is_cloud = values.get("is_cloud")
        parsed_url = urlparse(v)
        encoded_url_path = unquote(parsed_url.path)
        parsed_url = parsed_url._replace(path=encoded_url_path)

        if is_cloud:
            parts = parsed_url.path.split("/")
            if "f" in parts[1]:  # path is a sharepoint cloud folder
                cleaned_path = "/" + "/".join(parts[3:]) + "/"
            else:  # path is a sharepoint cloud file
                cleaned_path = "/" + "/".join(parts[3:])
            parsed_url = parsed_url._replace(path=cleaned_path)

        sharepoint_site_url = f"{parsed_url.scheme}://{parsed_url.netloc}/{parsed_url.path.split('/')[1]}/{parsed_url.path.split('/')[2]}"
        parsed_path = urlparse(sharepoint_site_url)

        if (
            "default.aspx" not in parsed_url.path
            and "Documents/Forms/AllItems.aspx" not in parsed_url.path
        ):  # sharepoint on-premise file or sharepoint cloud file/folder
            sharepoint_path_url = parsed_url.path[len(parsed_path.path) :]
        else:  # sharepoint on-premise folder
            if parsed_url.query == "":
                sharepoint_path_url = "Documents/"  # root folder sharepoint on-premise
            else:
                parsed_query = unquote(parsed_url.query)
                pattern = r"RootFolder=([^&]+)"
                match = re.search(pattern, parsed_query)
                if match:
                    folder_path = match.group(1)
                    path_parts = folder_path.split("/")
                    cleaned_path = "/".join(path_parts[3:]) + "/"
                sharepoint_path_url = cleaned_path

        if sharepoint_path_url.startswith("/"):
            sharepoint_path_url = sharepoint_path_url[1:]
        encoded_path = unquote(sharepoint_path_url)
        values["sharepoint_path"] = encoded_path
        if sharepoint_site is None:
            values["sharepoint_site"] = sharepoint_site_url
        else:
            if sharepoint_site != sharepoint_site_url:
                raise AutopilotConfigurationError(
                    f"The Sharepoint site values do not match! The value of SHAREPOINT_FETCHER_PROJECT_SITE is {sharepoint_site}, while the site extracted from SHAREPOINT_FETCHER_URL is {sharepoint_site_url}."
                )
        return v

    @validator("sharepoint_site", always=True)
    def validate_sharepoint_site(cls, v: Any, values: Dict[str, Any]):
        if v is None:
            return v
        if v.endswith("/"):
            return v
        return v

    @validator("destination_path", always=True)
    def validate_destination_path(cls, v: Any):
        try:
            return Path(v)
        except TypeError:
            raise AutopilotConfigurationError(
                f"Invalid destination path: {v}. "
                "It must be a string pointing to a directory."
            )

    @validator("force_ip", always=True)
    def validate_force_ip(cls, v):
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
        except ipaddress.AddressValueError:
            raise AutopilotConfigurationError(f"Invalid IP address: {v}")
        except Exception as e:
            raise AutopilotConfigurationError(f"Error validating IP address: {e}")
        return v

    @validator("custom_properties", always=True)
    def validate_custom_properties(cls, v: Any):
        if v is None or not v.strip():
            return v
        pattern = r"^[^=]+=>[^=]+=>[^=]+$"
        items = [i.strip() for i in v.split("|")]
        for item in items:
            if not re.match(pattern, item):
                raise AutopilotConfigurationError(
                    f"Could not parse title mapping: {item}. "
                    "It must have the format PropertyName=>ListTitle=>ListItemTitlePropertyName.",
                )
        return v

    @validator("download_properties_only", always=True)
    def validate_download_properties_only(cls, v: Any):
        if v is None or v == False or v == "false" or v == 0:
            return False
        elif v == True or v == "true" or v == 1:
            return True
        else:
            raise AutopilotConfigurationError(
                f"Could not parse SHAREPOINT_FETCHER_DOWNLOAD_PROPERTIES_ONLY parameter: {v}. "
                "It must be a boolean value.",
            )

    @validator("is_cloud", always=True)
    def validate_is_cloud(cls, v: Any):
        if v is None or v == False or v == "false" or v == 0:
            return False
        elif v == True or v == "true" or v == 1:
            return True
        else:
            raise AutopilotConfigurationError(
                f"Could not parse SHAREPOINT_FETCHER_IS_CLOUD parameter: {v}. "
                "It must be a boolean value.",
            )

    @validator("sharepoint_file", always=True)
    def validate_sharepoint_file(cls, v: Any, values: Dict[str, Any]):
        sharepoint_path = values.get("sharepoint_path")
        if not sharepoint_path:
            return None
        if not sharepoint_path.endswith("/"):
            if "/" not in sharepoint_path:
                raise AutopilotConfigurationError(
                    "If the given sharepoint path doesn't end with a slash, "
                    "it is assumed that the path points to a file. However the "
                    "given sharepoint path doesn't seem to point to a file as "
                    "there is no slash as separator between directory and filename. "
                    f"Please check that your sharepoint path (`{sharepoint_path}`) "
                    "either points to a directory (`Documents/Some/Folder/`) or to "
                    "a file (`Documents/Handbook.pdf`)."
                )
            (sharepoint_path, file) = sharepoint_path.rsplit("/", maxsplit=1)
            values["sharepoint_path"] = sharepoint_path + "/"
            return file
