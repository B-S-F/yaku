# Checking single properties

Given the sample data set below, we want to check if the `price` of the book with the title `The Lord of the Rings` is greater than `10`.

```{literalinclude} resources/store.json
---
language: json
---
```

**Steps:**

1. Define a `ref` that returns the object you are interested in. In this case we want to check the `price` of the book with the title `The Lord of the Rings`, so we can use `$.store.book[?(@.title == 'The Lord of the Rings')]` as `ref`.

    ```{note}
    You can use the [jsonPath online evaluator](http://jsonpath.com/) to check your jsonPath syntax.
    ```

2. Define a `condition` that checks the `price` of the book. In this case we can use `$.price > 10` as `condition`.

    ```{note}
    Of course you can also use other operators like `===`, `!==`, `<`, `<=` or `>=`.
    ```

Your config file then looks like this:

```yaml
checks:
  - name: lotr_price_greater_than_10
    ref: $.store.book[?(@.title == 'The Lord of the Rings')]
    condition: $.price > 10
```

For the example data set above, the result of this check would be: `GREEN`.
