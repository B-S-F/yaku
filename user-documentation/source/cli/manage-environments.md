<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Manage environments

Environments have their own subset of operations, as presented with `yaku envs -h`.

```bash
yaku envs -h

Usage: yaku environments|envs [options] [command]

Manage environments

Options:
  -h, --help                          display help for command

Commands:
  update|set <envName> <key> <value>  Update an existing environment
  list|ls [options]                   List all available environments
  edit|e                              Edit environments config file in external text editor
  switch|sw [envName]                 Switch to a different environment
  create|c [options] <envName>        Create a new Yaku CLI environment
  delete|d [envName]                  Delete a Yaku CLI environment
  help [command]                      display help for command
```

With the command `yaku envs list`, the environments are presented in a table that can be navigated using arrows (`↑`, `↓`, `→`, `←`) and `Tab`/`Shift+Tab` keys.

The user can also use `PgUp` and `PgDown` to circle through pages, as well as `Home` and `End` to jump directly to first and last page.

The selected environment is highlighted with `●` and the other environments with `○`.

```bash
yaku envs list
? Environments (Press <H> to toggle navigation help, <Enter> to save the changes and <Esc> to discard)

┌───┬──────┬────────────────────────┬───────────┬──────────────┬───────────────┬───────────────────────┬───┐
│ ● │ Name │ URL                    │ Namespace │ Access Token │ Refresh Token │ Expires At            │ ↕ │
├───┼──────┼────────────────────────┼───────────┼──────────────┼───────────────┼───────────────────────┼───┤
│ ○ │ env1 │ http://env1.url/api/v1 │ 1         │ ********     │ ********      │ 9/5/2024, 3:03:52 PM  │ ↑ │
├───┼──────┼────────────────────────┼───────────┼──────────────┼───────────────┼───────────────────────┼───┤
│ ● │ env2 │ http://env2.url/api/v1 │ 2         │ ********     │ ********      │ 9/5/2024, 3:03:52 PM  │   │
├───┼──────┼────────────────────────┼───────────┼──────────────┼───────────────┼───────────────────────┼───┤
│ ○ │ env3 │ http://env3.url/api/v1 │ 3         │ ********     │               │                       │ ↓ │
└───┴──────┴────────────────────────┴───────────┴──────────────┴───────────────┴───────────────────────┴───┘
```

Filtering the table elements is possible by pressing `Shift+F` (and provide the text to search for, followed by `Enter`). Once applied, the filter will be displayed at the beginning, as `? Environments(<filterText>)` To cancel the filtering, remove all the text and apply using `Enter`.

Some columns ( **Name**, **URL** and **Namespace**) can be used for sorting the elements. To activate it, focus any row in the column of interest and use `Shift+Up` to sort ascending (indicated by `▲`), or `Shift+Down` to sort descending (`▼`). Press the same combination again to cancel the sorting.

When focused, **Name**, **URL** and **Namespace** are highlighted with green color and can be modified in two ways:

- *override*, by initiating with `Delete`.
- *append*, by initiating with `Insert`.

During editing, `Esc` key will cancel the changes, while `Enter` will confirm them.

When focused, a non-current environment marked with `○` can be set as current by pressing `Space` key.

Should the system detect changes in the values, it will warn the user with the following message:

`You have unsaved changes changes. Press <Enter> and confirm to save them`

Before closing, the table prompts for confirmation, as followings:

- `Press ENTER again to confirm (save changes)!`, and with doing so the changes will be saved.
- `Press ESC again to exit (discard changes)!`, and with doing so the changes will be discarded.

A more advanced alternative is `yaku envs edit`. With it, the JSON contents of underlying `.yakurc` is opened in an external text editor (system's default).
