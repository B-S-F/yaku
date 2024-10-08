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
    file: str
    rules: List[Rule]


def read_file_rules(config_file_data: ConfigFileContent | None) -> List[FileRules]:
    result: List[FileRules] = []

    for file_entry in config_file_data or []:
        file_name = next(iter(file_entry), "")  # get first (and only) key
        path = Path(file_name)
        if path.suffix == "":  # to deprecate in future releases
            file_name = f"{file_name}.pdf"

        rules = []
        for file, rule in file_entry.items():
            if not isinstance(rule, dict):
                continue

            other_value = rule.get("signature_not_older_than")
            if not other_value:
                continue

            current_prop = rule.get("operator") if isinstance(rule, dict) else None
            if current_prop and current_prop.lower() == "one-of":
                prop = "one-of"
            else:
                prop = "all-of"

            rules.append(
                Rule(property=prop, operator="not-older-than", other_value=other_value)
            )

        if rules:
            result.append(FileRules(file_name, rules))

    return result
