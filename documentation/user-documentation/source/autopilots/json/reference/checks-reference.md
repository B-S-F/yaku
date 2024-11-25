<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Defining Checks

This page is an introduction to performing checks on a JSON data set. It provides information on various types of checks that can be performed and how to define conditions for those checks. The examples on this page utilize a sample data set, which is provided in the following snippet:

```{literalinclude} ../how-to/resources/store.json
---
language: json
---
```

## References

For a `ref` in a JSON evaluator config file you should always use a [jsonPath](https://github.com/dchester/jsonpath) expression that returns an array of the objects you are interested in. Hereby you can use the `[*]` operator to get all objects of an array. But be careful what you actually need: if you want to check, for example, if the tags of any book contains `book` you could get all tags via `$.store.book[*].tags[*]`. This results in:

```json
[
  "Rees",
  "reference",
  "Sayings",
  "Waugh",
  "fiction",
  "Sword",
  "Melville",
  "fiction",
  "Moby"
]
```

But if you want to check if the tags of each book contains `book`, you need to get the tags of each book. This can be done via `$.store.book[*].tags`. This results in:

```json
[
  ["book", "Rees", "reference", "Sayings"],
  ["book", "Waugh", "fiction", "Sword"],
  ["book", "Melville", "fiction", "Moby"],
  []
]
```

Now we could use `all(ref, "($).includes('book')")` to check if all books have the tag `book`. Alternatively you could use the jsonPath expression `$.store.book` as `ref` and use `all(ref, "($.tags).includes('book')")` to check if all books have the tag `book`.

If you want to check a single object you can use `ref: $` to get the root object.

To check your jsonPath syntax you can use the [jsonPath online evaluator](http://jsonpath.com/)

## Conditions

### Simple conditions

```yaml
ref: $.store.book[*]
condition: all(ref, "$.category === 'fiction'") # all values of ref with the key "category" are equal to "fiction"
condition: any(ref, "$.category === 'fiction'") # at least one value of ref with the key "category" is equal to "fiction"
condition: one(ref, "$.category === 'fiction'") # exactly one value of ref with the key "category" is equal to "fiction"
condition: none(ref, "$.category === 'fiction'") # none of the values of ref with the key "category" is equal to "fiction"
```

Of course you can use any other condition like: `!==`, `>`, `<`, `>=`, `<=`.

### Array conditions

These conditions check and compare the required object value against an array of possible values:

```yaml
ref: $.store.book[*]
condition: $[*].category === ["fiction", "reference"] # the categories of ref are equal to ["fiction", "reference"] (order matters)
condition: $[*].category !== ["fiction", "reference"]  # the categories of ref are not equal to ["fiction", "reference"] (order matters)
condition: ($[*].category).includes('fiction') # the categories of ref includes "fiction"
condition: ($[*].category).length == 1 # the categories of ref is an array with length 1
```

### Concatenation

The `concatenation` part of the config file also has a condition field. This condition is a logical expression that is evaluated with the results of the checks and should contain references to the names of the checks e.g. `check1 && check2`.

If no `concatenation` is defined the result of the evaluation is the result of all checks concatenated with AND condition `&&`.

```yaml
concatenation:
  condition: "has_category_check && category_check && fiction_check && none_fantasy_check"
```

## Example

A full example of a config file can be found [here](resources/example-config.yaml).
