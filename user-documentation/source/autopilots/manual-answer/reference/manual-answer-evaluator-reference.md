<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Evaluator Background Information

An evaluator that checks if a given manual answer has passed it's expiration time.
The `mdate` (modification date) of the answer's file is used as a reference.

## Environment variables

```{envvar} manual_answer_file
The path to the manual answer file.
```

```{envvar} expiration_time
The time in which your answer expires since last modification date.

**Allowed inputs**: `<number> <unit> <number> <unit> ...`

**Allowed units**:

- hours (h, hr)
- days (d)
- weeks (w, wk)
- years (y, yr)
- Check the [parse-duration package](https://www.npmjs.com/package/parse-duration) for more options

```

```{envvar} last_modified_date_override
(Optional) The last modified date will change if a file is e.g. downloaded, moved or copied.
This environment variable will override the last modified date
The provided date should conform to [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601)

```

```{envvar} expiry_reminder_period
(Optional) How many days before expiration, should the manual answer be marked as YELLOW status.

**Allowed inputs**: `<number> <unit> <number> <unit> ...`

**Allowed units**:

- hours (h, hr)
- days (d)
- weeks (w, wk)
- years (y, yr)
- Check the [parse-duration package](https://www.npmjs.com/package/parse-duration) for more options

**Default is 14d**
```

## Example config

Below is an example configuration file that runs manual-answer evaluator for a file called {file}`example-answer.md`. The autopilot is configured in lines: 7-14. Then the autopilot is used by the check 1 in line 29 which is part of requirement 1.15.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-14, 29
---
```
