# Custom Python Apps

In contrast to {doc}`../papsr/index`, you can also develop your own Python apps, which
can run independently of [PAPSR](../papsr/index).

Basically, any executable will work somehow, as long as it fulfills the
autopilot communication protocol (see {doc}`../../reference/interfaces/json-lines`).

However, to support you in writing custom apps and to simplify the interface
handling, there exists the `autopilot-utils` Python package.

Read more about how to [create a Python app with Poetry](./creating-an-app).

## Guides

```{toctree}
:maxdepth: 1

creating-an-app
```
