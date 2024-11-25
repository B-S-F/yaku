<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Create an environment

First you need to create a environment with the `yaku envs create` command.

```bash
yaku envs create my-first-env
# ? URL of the environment <the yaku api url> https://yaku.bswf.tech/api/v1
# ? Token for the environment <your token>
# ? Namespace for the environment <your namespace id> e.g. 1
```

If the environment created, you can use the `yaku envs switch` command to switch to the environment.

```bash
yaku envs switch my-first-env
```

Now you are ready to use the yaku cli with your environment.
