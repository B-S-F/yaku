from dataclasses import dataclass
from typing import List, Optional, Union

from yaku.autopilot_utils.checks import checks_dict
from yaku.autopilot_utils.errors import AutopilotConfigurationError

from .config import ConfigFileContent


@dataclass
class Selector:
    property: str
    operator: str
    other_value: Optional[Union[str, int, float]] = None

    def __post_init__(self):
        if self.operator not in checks_dict:
            raise AutopilotConfigurationError(
                f"Unknown operator '{self.operator}'! Supported operators are: {', '.join(checks_dict.keys())}"
            )

    def __str__(self) -> str:
        return f"Selector({self.property}=>{self.operator}=>{self.other_value})"

    def nice(self) -> str:
        """Provide a nice string representation of the selector."""
        try:
            check_fn = checks_dict[self.operator]
            check_fn_string: str = check_fn._nice
            return f"Property `{self.property}` {check_fn_string} `{self.other_value}`"
        except Exception:
            return str(self)


@dataclass
class FilesSelectors:
    filter: str
    selectors: List[Selector]
    title: str = ""
    onlyLastModified: bool = False

    def __str__(self) -> str:
        return f"FilesSelector(filter: `{self.filter}`, selectors: [{', '.join([str(s) for s in self.selectors])}])"


def parse_config_file_data(config_file_data: ConfigFileContent) -> List[FilesSelectors]:
    """
    Parse filter rules content `config_file_data` from a config file.

    The config file must follow the following YAML syntax (ensured by the ConfigFile model):

        - files: "UsuallyARevisionSet(1)/*"
          title: "Optional title for referring to the selected file"
          select:
            - property: <SomeProperty>
              <operator>: <SomeValue>
          onlyLastModified: true
        - files: "AnotherRevisionSet(1)/*"
          title: "Optional title for referring to the selected file"
          select:
            - property: <SomeProperty>
              <operator>: <SomeValue>
          onlyLastModified: true
          ...
        ...

    It consists of a list of file selectors, where the `files` value contains a
    path filter expression.

    The `select` list for each file selector is a simple list with one
    `property` field which defines the file property to be used for selecting
    the wanted file.

    The `operator` is a string defining the check operation, e.g. `equals` or `is-less-than`.

    Most operators are binary operators; so they require a second value which can
    be given behind the operator, e.g. `equals: 5` or `contains: some text`.
    """
    result = []
    for files_entry in config_file_data:
        selectors = []
        # TODO: warn if there is no select but a rules item
        for selector in files_entry.select:
            property = selector.pop("property")
            if len(selector) != 1:
                raise AutopilotConfigurationError(
                    f"Selector for `{property}` of file `{files_entry.files}` has no condition defined!"
                )
            operator, other_value = selector.popitem()
            selectors.append(
                Selector(property=property, operator=operator, other_value=other_value)
            )
        result.append(
            FilesSelectors(
                files_entry.files,
                selectors,
                files_entry.title,
                onlyLastModified=files_entry.onlyLastModified,
            )
        )
    return result
