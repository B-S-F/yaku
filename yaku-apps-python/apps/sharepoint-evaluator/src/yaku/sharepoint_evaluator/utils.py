import json
from pathlib import Path
from typing import Any, Dict, Optional

from yaku.autopilot_utils.errors import AutopilotConfigurationError, FileNotFoundError


class PropertiesReader:
    def __init__(self, custom_property_definitions_file: Path):
        self._cache: Dict[str, Any] = {}
        self._property_map: Optional[Dict[str, Dict[str, str]]] = None
        self._property_name_map: Dict[str, str] = {}
        self._custom_property_definitions_file = custom_property_definitions_file

    @property
    def property_map(self):
        if self._property_map is None:
            if self._custom_property_definitions_file.exists():
                self._property_map = self._read_property_definitions_file(
                    self._custom_property_definitions_file
                )
            else:
                raise FileNotFoundError(
                    f"File {self._custom_property_definitions_file} does not exist!"
                )
        return self._property_map

    @staticmethod
    def _read_property_definitions_file(
        property_definitions_file: Path,
    ) -> Dict[str, Dict[str, str]]:
        with property_definitions_file.open("r") as fh:
            return json.load(fh)  # type: ignore

    def add_list_to_property_mapping(self, list_name: str, property_name: str):
        """
        Add a mapping relation between a SharePoint list and a file property.

        Some file properties are defined as enum types so they have an attached
        SharePoint list which contains all possible values together with titles.

        For example, there might be a file property `SomeStatusId` which is
        related to a SharePoint List `Some Status`. If `SomeStatusId == 1`,
        you can look up item `1` in the SharePoint List and retrieve a title, e.g.
        `Draft`.

        This method here creates such a mapping. The `list_name` must be the
        name of the SharePoint list, and the property name is the file's
        property identifier as used by the REST API (you can find those names
        also in the `*.__properties__.json` files).

        The mapping can later be used to retrieve file properties with the
        `get_file_property` function in a way that if you give the original
        file property title, e.g. `SomeStatusId`, as `property_name`,
        it returns `1`, but if you give the list title `Some Status` as
        `property name`, it will return the list item title, e.g. `Draft`.
        """
        self._property_name_map[list_name] = property_name

    def get_file_property(self, file_path: Path, property_name: str) -> Any:
        """
        Get property of a file.

        Returns the property value for the given `file_path` and
        `property_name`. In case of a custom property with listed values
        the id is automatically replaced by the list value, e.g. instead
        of a `Status=1`, you'll get a `Status="Draft"` or similar.
        """
        properties_file = file_path.with_suffix(file_path.suffix + ".__properties__.json")

        if not file_path.exists() and not properties_file.exists():
            other_possible_files = file_path.parent.glob("*")
            alternatives_list = "".join([f"- {p}\n" for p in other_possible_files])
            raise AutopilotConfigurationError(
                f"Cannot read file properties for {file_path}. File doesn't exist! "
                "There are only the following files:\n"
                f"{alternatives_list}"
            )

        cache_key = str(properties_file)
        if cache_key not in self._cache:
            with properties_file.open("r") as fh:
                properties = json.load(fh)
            self._cache[cache_key] = properties

        try:
            if property_name in self._property_name_map:
                alias_name = self._property_name_map[property_name]
                property_value = self._cache[cache_key][alias_name]
            else:
                property_value = self._cache[cache_key][property_name]
                return property_value if property_value is not None else ""
            if property_value is None:
                return ""
        except KeyError:
            valid_names = set(self._cache[cache_key].keys()) | set(
                self._property_name_map.keys()
            )
            raise AutopilotConfigurationError(
                f"Could not get property `{property_name}` for `{file_path}`! "
                f"Valid property names are: {', '.join(valid_names)}"
            )
        else:
            return self.property_map[property_name][str(property_value)]
