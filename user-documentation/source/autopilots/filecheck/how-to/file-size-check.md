# How to check the size of a file

## Checking that a file is not empty

If you want to make sure that some downloaded file is not empty,
use the following code in your autopilot script:

```bash
filecheck size --min 1 "data.json"
```

The example above will return a red status if the file `data.json`
is empty (has a length of zero bytes).

## Checking that a file's size is within limits

If you want to check if a file is larger or smaller than a given value,
you can also do this with just one call to the `filecheck` app:

```bash
filecheck size --min 1 --max 10000000 "MyDocument.pdf"
```

The example above will return a red status if the file `MyDocument.pdf`
is either empty or larger than about 10MB.

```{note}
The expected file sizes are given in bytes, so in the example above, the
size is expected to be between one and ten million bytes.
```
