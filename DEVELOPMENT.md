<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

Developer documentation for the project.

# Pre-commit hooks
This project uses pre-commit hooks to ensure that code is formatted correctly and so on.
To install pre-commit tool run:
```bash
pip install pre-commit
pre-commit install
```
Now the hooks will run on every commit.
See also [.pre-commit-config.yaml](./.pre-commit-config.yaml) for the configuration.

# License / Copyright Header

To add a license and copyright header to your files using the REUSE tool, use the following command:

```
pipx run reuse annotate --license MIT <file / folder name> --recursive \
--skip-unrecognised --copyright="grow platform GmbH" --merge-copyrights
```
- **Install REUSE**: Ensure the REUSE tool is installed via `pipx`.
- **Select License**: Choose a license and place its text in the `LICENSES/` directory.
- **Annotate Files**: Use the command to add headers recursively, skipping unrecognized files.
- **Verify Compliance**: Verification is done with a pre-commit hook, see above chapter.
