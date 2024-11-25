<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Get findings

In order to get findings you need to use the `yaku findings list <configId>` command.

```bash
yaku findings list 1013
# {
#   "id": "1cc3d652-24a0-4e60-93bf-60efbf33ddc3",
#   "uniqueIdHash": "cc6f5e84f2cb19b0f45274277220d1e29615ed24c18b33157eb6405023961565",
#   "metadata": {},
#   "namespaceId": 35,
#   "configId": 1013,
#   "runId": 1435,
#   "runStatus": "completed",
#   "runOverallResult": "RED",
#   "runCompletionTime": "2024-03-07T15:32:55.000Z",
#   "chapter": "1",
#   "requirement": "1",
#   "check": "1",
#   "criterion": "Criterion",
#   "justification": "I am the reason 6",
#   "occurrenceCount": 15,
#   "status": "resolved",
#   "resolvedComment": "This finding was automatically resolved by run 1435",
#   "resolvedDate": "2024-03-07T15:34:52.490Z",
#   "resolver": "Yaku",
#   "createdAt": "2024-02-29T06:21:40.347Z",
#   "updatedAt": "2024-03-07T15:34:52.487Z"
# }
```
