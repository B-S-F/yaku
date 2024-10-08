from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Union

from yaku.autopilot_utils.checks import checks_dict
from yaku.autopilot_utils.errors import AutopilotConfigurationError

from .config import ConfigFileContent


@dataclass
class Rule:
    property: str
    operator: str
    other_value: Optional[Union[str, int, float]] = None

    def __post_init__(self):
        if self.operator not in checks_dict:
            raise AutopilotConfigurationError(
                f"Unknown operator '{self.operator}'! Supported operators are: {', '.join(checks_dict.keys())}"
            )

    def __str__(self):
        return f"Rule({self.property}=>{self.operator}=>{self.other_value})"

    def nice(self) -> str:
        """Provide a nice string representation of the rule."""
        try:
            check_fn = checks_dict[self.operator]
            check_fn_string: str = check_fn._nice
            return f"Property `{self.property}` {check_fn_string} `{self.other_value}`"
        except Exception:
            return str(self)


@dataclass
class FileRules:
    file: Path
    rules: List[Rule]


def read_file_rules(config_file_data: ConfigFileContent, base_path: Path) -> List[FileRules]:
    """
    Parse file rules content `config_file_data` from a config file.

    The config file must follow the following YAML syntax:

        - file: <SomeDocument>
          checks:
            - property: <SomeProperty>
              <operator>: <SomeValue>
          ...
        ...

    It consists of a list of file rules, where the `file` is given by a relative path
    starting at the `base_path` argument.

    The `checks` for each file are a simple list with one `property` field which
    defines the file property to be checked.

    The `operator` is a string defining the check operation, e.g. `equals` or `is-less-than`.

    Most operators are binary operators; so they require a second value which can
    be given behind the operator, e.g. `equals: 5` or `contains: some text`.
    """
    result = []
    for file_entry in config_file_data:
        rules = []
        for rule in file_entry.rules:
            property = rule.pop("property")
            if len(rule) == 0:
                raise AutopilotConfigurationError(
                    f"There is no check given for property '{property}'! "
                    "Please add something like: 'is-equal: \"some string\"'"
                )
            operator, other_value = rule.popitem()
            rules.append(Rule(property=property, operator=operator, other_value=other_value))
        result.append(FileRules(base_path / file_entry.file, rules))
    return result
