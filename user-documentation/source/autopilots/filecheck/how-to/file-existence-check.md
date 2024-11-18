# How to check if a file exists

To check if a file exists in your working directory, you need just one line.

```bash
filecheck exists "MyDocument.pdf"
```

Just replace the `MyDocument.pdf` part above with your document's name.
Make sure to surround the filename with quotes, or there might be issues
with special characters, e.g., whitespace.

If the document name is stored in a variable, for example `DOCUMENT`, you should
quote the argument:

```bash
filecheck exists "${DOCUMENT}"
# or
filecheck exists "$DOCUMENT"
```
