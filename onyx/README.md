![Code Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/frank-bee/819f17e6f8166534e73c8acf9ee58726/raw/onyx-coverage-badge.json)
[![Doing Merge check](https://github.com/B-S-F/onyx/actions/workflows/merge-check.yml/badge.svg)](https://github.com/B-S-F/onyx/actions/workflows/merge-check.yml)
# ONYX

Onyx interprets qg-config.yaml v1 files and performs the tasks specified therein.

## Usage

```bash
make build
./bin/onyx
```

### Environment variables

Instead of passing flags to the CLI, you can also set environment variables. E.g. `ONYX_LOG_LEVEL=debug` will set the log level to debug. The Prefix is always `ONYX_` followed by the flag name in uppercase with underscores instead of dashes.

The order of precedence for configuration sources is as follows:
- Flags
- Environment variables
- Config file
- Default values

### Migrate a existing qg-config.yaml

```bash
./bin/onyx migrate path/to/qg-config.yaml --output path/to/new-qg-config.yaml
### example
./bin/onyx migrate ./examples/qg-config.yaml --output ./examples/new-qg-config.yaml
```

### Get a schema for the qg-config.yaml

```bash
./bin/onyx schema
```

### Execute a qg-config.yaml

```bash
./bin/onyx exec path/to/folder 
### example
./bin/onyx exec ./examples
```

If you don't provide a path, the current working directory will be used. The folder must contain a `qg-config.yaml`, `.vars` and `.secrets` file. All of them can be changed via the flags `--config-name`, `--vars-name` and `--secrets-name` (see also `./bin/onyx exec --help`)

The `.vars` and `.secrets` files are json files which follow this format:

```
{
  "KEY1": "VALUE",
  "KEY2": "file://path/to/file",
  "KEY3": "LINE1\\nLINE1\\nLINE3"
}
```

The file referenced with the `file://` prefix will be read and the content will be used as the value for the key.


## Development

[DEVELOPMENT.md](DEVELOPMENT.md)
