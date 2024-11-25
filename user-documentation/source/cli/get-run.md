<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Show run status

In order to get a run you need to use the `yaku runs show <runId>` command.

```bash
yaku runs show 2839
```

```json
{
  "id": 2839,
  "status": "completed",
  "config": "https://yaku.bswf.tech/api/v1/namespaces/1/configs/148",
  "overallResult": "FAILED",
  "creationTime": "2023-03-01T17:48:05.000Z",
  "completionTime": "2023-03-01T17:48:15.000Z"
}
```

You can also retrieve the run result with the `yaku runs result <runId>` command.
Same works for the evidences with the `yaku runs evidences <runId>` command.
