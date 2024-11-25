<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# HTML Finalizer

The HTML finalizer will generate a set of HTML files:

- {file}`qg-result.html`: An overview report that contains a list of all requirements and their final status. The status of a requirement depends on the status of its underlying checks.
- {file}`qg-evidence.html`: This report contains a detailed list of all checks and components and their status. It also contains links to the generated output folder of each run in evidence folder so they could be accessed.
- {file}`qg-dashboard.html`: A graphical overview that shows statics of the current run.
- {file}`qg-full-report.html`: A file that contains the three previous html reports.

## How to use the finalizer in a config?

The HTML finalizer can be added to configs by specifying it in the run property of the finalize section.
