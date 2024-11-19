# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import glob
import sys
from pathlib import Path

import yaml

workflow_file = Path(".github/workflows/create-release-pr.yml")
yaml_data = yaml.safe_load(workflow_file.open())

release_package_names = yaml_data[True]["workflow_dispatch"]["inputs"]["release_package"][
    "options"
]
app_directory_names = glob.glob("apps/*")
diff = set(release_package_names) ^ set(app_directory_names)
if diff:
    print(
        f"Please check {workflow_file} and compare list of available release packages with apps folder for: {diff}"
    )
    sys.exit(1)
else:
    print("Everything fine! All apps are listed in `create-release.yml`.")
