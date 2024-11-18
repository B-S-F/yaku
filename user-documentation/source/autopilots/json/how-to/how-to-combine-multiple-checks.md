# Combining multiple checks

Given the sample data set below, we want to check if each book has a at least one tag and if there is no book with the category `fantasy`.

```{literalinclude} resources/store.json
---
language: json
---
```

```{note}
You can use the [jsonPath online evaluator](http://jsonpath.com/) to check your jsonPath syntax.
```

We have to define two checks now:

## Check if each book has a at least one tag

1. Define a `ref` that returns the object you are interested in. In this case we want to check if each book has a at least one tag, so we can use `$.store.book[*]` as `ref`.

2. Define a `condition` that checks if the book has a at least one tag. In this case we can use `$.tags.length() > 0` as `condition`.

## Check if there is no book with the category `fantasy`

3. Define a `ref` that returns the object you are interested in. In this case we want to check if there is no book with the category `fantasy`, so we can use `$.store.book[*]` as `ref`.

4. Define a `condition` that checks if the book has the category `fantasy`. In this case we can use `!($[*].category).includes('fantasy')` as `condition`.

## Combining the checks

5. Define a `condition` that references and combines the two checks. In this case we could use `has_at_least_one_tag && no_fantasy_book` as `condition`.

Your config file then looks like this:

```yaml
checks:
  - name: has_at_least_one_tag
    ref: $.store.book[*]
    condition: none(ref, "($.tags).length === 0")
  - name: no_fantasy_book
    ref: $.store.book[*]
    condition: (!($[*].category).includes('fantasy'))
concatenation:
  condition: has_at_least_one_tag && no_fantasy_book
```

For the example data set above, the result of the `has_at_least_one_tag` check would be `RED` and the result of the `no_fantasy_book` check would be `GREEN`. The result of the `concatenation` check would be `RED` because the `&&` operator requires both checks to be `GREEN` to return `GREEN`.

```{note}
You can also use the `||` operator to combine checks. This operator requires at least one check to be `GREEN` to return `GREEN`.
```
