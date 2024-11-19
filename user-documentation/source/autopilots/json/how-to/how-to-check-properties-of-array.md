<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Checking properties of an array of objects

Given the sample data set below, we want to check if the `price` of each book is greater than `10`.

```{literalinclude} resources/store.json
---
language: json
---
```

**Steps:**

1. Define a `ref` that returns an array of the objects you are interested in. In this case we want to check the `price` of each `book`, so we can use `$.store.book[*]` as `ref`.

    ```{note}
    You can use the [jsonPath online evaluator](http://jsonpath.com/) to check your jsonPath syntax.
    ```

2. Define a `condition` that checks the `price` of each `book`. In this case we can use `all(ref, "$.price > 10")` as `condition`.

    ```{note}
    There are also other operators like `any`, `none` and `one` that you can use.
    ```

Your config file then looks like this:

```yaml
checks:
  - name: book_prices_greater_than_10
    ref: $.store.book[*]
    condition: all(ref, "$.price > 10")
```

For the example data set above, the result of this check would be: `RED`.
