<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Using JSONPath Syntax

## Introduction

The syntax and examples with slight changes are taken from [the jsonpath Github](https://github.com/dchester/jsonpath) and are adapted from [Stefan Goessner's original post](http://goessner.net/articles/JsonPath/).

| JSONPath           | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `$`                | The root object/element                                              |
| `@`                | The current object/element                                           |
| `.`                | Child member operator                                                |
| `..`               | Recursive descendant operator; JSONPath borrows this syntax from E4X |
| `*`                | Wildcard matching all objects/elements regardless their names        |
| `[]`               | Subscript operator                                                   |
| `[,]`              | Union operator for alternate names or array indices as a set         |
| `[start:end:step]` | Array slice operator borrowed from ES4 / Python                      |
| `?()`              | Applies a filter (script) expression via static evaluation           |
| `()`               | Script expression via static evaluation                              |

Given this sample data set, see example expressions below:

```{literalinclude} ../how-to/resources/store.json
---
language: json
---
```

Example JSONPath expressions:

| JSONPath                                          | Description                                                 |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `$.store.book[*].author`                          | The authors of all books in the store                       |
| `$..author`                                       | All authors                                                 |
| `$.store.*`                                       | All things in store, which are some books and a red bicycle |
| `$.store..price`                                  | The price of everything in the store                        |
| `$..book[2]`                                      | The third book                                              |
| `$..book[(@.length-1)]`                           | The last book via script subscript                          |
| `$..book[-1:]`                                    | The last book via slice                                     |
| `$..book[0,1]`                                    | The first two books via subscript union                     |
| `$..book[:2]`                                     | The first two books via subscript array slice               |
| `$..book[?(@.isbn)]`                              | Filter all books with isbn number                           |
| `$..book[?(@.price<10)]`                          | Filter all books cheaper than 10                            |
| `$..book[?(@.price==8.95)]`                       | Filter all books that cost 8.95                             |
| `$..book[?(@.price<30 && @.category=="fiction")]` | Filter all fiction books cheaper than 30                    |
| `$..*`                                            | All members of JSON structure                               |

To easily test those examples you can use the [jsonPath online evaluator](http://jsonpath.com/).
