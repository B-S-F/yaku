<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# More commands

If you want more information about the cli or any commands, you can use the `-h` or `--help` flag.

```bash
yaku --help
```

```text
Usage: yaku [options] [command]

Usage: yaku [options] [command]

CLI for Yaku Service

Options:
  -V, --version              output the version number
  -k, --no-ssl-verify        disable TLS certificate validation
  -h, --help                 display help for command

Commands:
  about [options]            Get information on the cli
  info [options]             Get service info
  login [options] [envName]  Login to the Yaku CLI
  environments|envs          Manage environments
  runs|r                     Manage qg runs
  configs|cfg                Manage configs
  files|f                    Manage files of a config
  findings|fnd               Manage findings of a config
  secrets|s                  Manage secrets
  namespaces|ns              Manage namespaces
  rate-limits|rl             Manage rate-limits for runs (admin access required)
  users|usr                  Manage users (admin access required)
  tokens|tks                 Manage user tokens (admin access required)
  help [command]             display help for command
```
