# Autopilot Output as JSON Lines

An {term}`autopilot` must provide information about its execution by printing
out [JSON Lines](https://jsonlines.org/). In the case of an evaluation of
release criteria, information about the successful or unsuccessful evaluation
must be given.

The {term}`autopilot script` can write any number of JSON Lines to the stdout
stream, and they will be processed line by line. Any line that cannot be parsed
will be ignored, but it will still show up in the log of the autopilot.

Usually, the {term}`autopilot script` only calls an {term}`autopilot app` and
the app prints out the status information as JSON lines.

## General structure

Each JSON line must be an object that can contain one or more of the following
keys:

| key      | kind    | description                                                             |
| :------- | :------ | :---------------------------------------------------------------------- |
| status   | replace | the result status of the evaluation                                     |
| reason   | replace | a detailed explanation of the result                                    |
| result   | append  | an object that contains result information                              |
| output   | append  | an object that contains information of outputs that may be used in post processing   |

The following sections describe the different kinds of information,
whether they are required or not and what the expected data structure is.

## Status (required)

A string representing the status of the autopilot. The possible values for autopilots are:

* `RED`: Indicates a critical issue that requires immediate attention.
* `YELLOW`: Indicates a warning or potential issue that needs to be addressed.
* `GREEN`: Indicates a successful and satisfactory state.
* `FAILED`: Indicates that the app execution encountered a failure.

THe following values are reserved for manual answers:

* `NA`: Indicates that the requirement is not applicable to the current context.
* `UNANSWERED`: Indicates that the requirement has not been answered yet.

In case, an autopilot fails unexpectedly, the service will set an error state:

* `ERROR`: Indicates that the service encountered an unexpected error.

```{code-block} bash
---
caption: "Example of a bash script printing a JSON line with just a status field."
---

echo '{"status": "GREEN"}' # or "YELLOW", "RED", "FAILED"
```

## Reason (required)

A string providing a detailed explanation what exactly led to the returned
status. Should not be longer than 2-3 sentences.

```{code-block} bash
---
caption: "Example of a bash script printing a status and a reason."
---

echo '{"status": "RED", "reason": "The required document was not found!"}'
```

## Outputs (optional)

An object containing arbitrary key-value pairs to pass information to the next
app/autopilot. This allows apps to provide additional data for downstream processing.

```{code-block} bash
---
caption: "Example of a bash script printing one output called 'key'."
---
echo '{"output": {"key": "value"}}'
```

## Results (optional)

```{note}
The `results` field is only optional for autopilots with a `FAILED` status. For all other autopilots with a `RED`, `YELLOW`, or `GREEN` status, the `results` field is required.
```

An array of result objects, each representing a particular criterion and its
details. Each `result` object contains the following fields:

* `criterion` (string): A required string describing the criterion or
  requirement being evaluated.
* `justification` (string): An required string explaining the reasoning or
  justification for the result or decision related to the specific criterion.
* `fulfilled` (boolean): A required boolean value indicating whether the
  criterion has been fulfilled (true) or not (false).
* `metadata` (object): An optional object containing additional information or
  context related to the criterion as key-value pairs.

```{code-block} bash
---
caption: Example of a bash script printing out a result.
---
echo '{"result": {"criterion": "criterion1", "metadata": {"key": "value"}, "justification": "justification1", "fulfilled": true}}'
```
