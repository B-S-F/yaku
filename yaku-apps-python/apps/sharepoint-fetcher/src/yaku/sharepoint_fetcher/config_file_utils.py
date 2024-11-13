import os
from pathlib import Path
from typing import Dict, Optional


def merge_cli_and_file_params(cli_arguments: Dict, file_params: Optional[Dict] = None) -> Dict:
    """
    Merge the environment variables / CLI options with the configuration file parameters.

    CLI options take precedence over configuration file parameters.
    If a parameter is defined in both, the value from the CLI option will be used, unless the parameter
    is 'is_cloud', 'destination_path', or 'output_dir', in which case the value from the file will be used
    if it is not None.
    """
    default_fields = {"is_cloud": False, "destination_path": Path(os.getcwd())}

    if not file_params:
        file_params = {}

    merged_arguments = cli_arguments.copy()

    for key, value in file_params.items():
        if key not in merged_arguments or merged_arguments[key] is None:
            merged_arguments[key] = file_params[key]

    for key, value in merged_arguments.items():
        if key in default_fields and value is None:
            merged_arguments[key] = default_fields[key]

    return merged_arguments
