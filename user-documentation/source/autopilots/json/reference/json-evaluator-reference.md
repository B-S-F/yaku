# Evaluator Background Information

An evaluator to evaluate generic JSON files. It can be used to evaluate the output of any fetcher that stores JSON formatted data.

## Environment variables

```{envvar} JSON_INPUT_FILE
The filename of the JSON formatted data to evaluate.
```

```{envvar} JSON_CONFIG_FILE
The path of the evaluator's configuration file. More details about the config file can be found right below.
```

## Config file

A yaml file with the following structure should be created in the location referenced by the {envvar}`JSON_CONFIG_FILE` environment variable. Here, you can define the conditions to be checked for the evaluation of the input JSON data.

```{literalinclude} resources/example-config.yaml
---
language: yaml
---
```

The config file consists of two main parts:

1. **Checks**: This part is used to evaluate the JSON objects and define specific checks.

   - Each check includes the following elements:
     - `name`: The name assigned to the check.
     - `ref`: The JSONPath expression used to specify the property or properties to be evaluated. You can refer to the [JSONPath reference](../reference/jsonpath-reference) for more information.
     - `condition`: The condition that needs to be met for the check to pass. Details on how to define conditions can be found in the [checks reference](checks-reference) and the associated how-tos.
     - Optional values:
       - `log`: This value will be logged if the check results in a `RED` or `YELLOW` status.
       - The following properties define the result value for certain result conditions and can be set to `GREEN`, `YELLOW`, or `RED`:
         - `true`: Defines what color value is returned if the condition is met (default: `GREEN`).
         - `false`: Defines what color value is returned if the condition is not met (default: `RED`).
         - `return_if_empty`: Defines what color value is returned if the `ref` or the `condition` is empty (default: `RED`).
         - `return_if_not_found`: Defines what color value is returned if the `ref` or the `condition` is not found (default: `RED`).

2. **Concatenation**: This part is used to combine the results of the checks.
   - The concatenation section includes the following elements:
     - `condition`: The logical expression evaluated using the results of the checks. It should contain references to the names of the checks, such as `check1 && check2`.
   - If no concatenation is defined, the evaluation result is based on the concatenation of all checks using the AND condition (`&&`).

By using these checks and concatenation, you can perform evaluations on the JSON data set and determine the status of each check based on the specified conditions.

For further details and examples, you can refer to the [example config file](resources/example-config.yaml).

The config file has two parts: `checks` and `concatenation`. The `checks` part is used to evaluate the JSON objects. The `concatenation` part is used to combine the results of the `checks` part.

Under the `checks` part you can define multiple checks.
Each check has a name, a reference to the json property (see also {doc}`../reference/jsonpath-reference`), a condition and five optional values: `log` (see also {doc}`../reference/jsonpath-reference`) that will be logged in case of RED/YELLOW checks, `true` (by default `GREEN`), `false` (by default `RED`), `return_if_empty` (by default `RED`) and `return_if_not_found`  (by default `RED`).

With `condition` you can define the condition that has to be met for the check to pass. More details on how to define conditions can be found in {doc}`checks-reference` and the `how-tos`.
The `true` value is the result of the check when the condition is met and the `false` value is the result of the check when the condition is not met.
For all true and false values you can use the following values: `GREEN`, `YELLOW` and `RED`.

## Example Config

You can find a complete example configuration here: {doc}`../tutorials/json-evaluator`.
