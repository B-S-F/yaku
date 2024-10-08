# Developer docs 

## Setup

1. Install [go](https://golang.org/doc/install) (1.20)
2. Install [make](https://www.gnu.org/software/make/)
3. Run `make setup`

### Vscode integration

Go vscode integration is pretty good. 
Just install the [go extension](https://marketplace.visualstudio.com/items?itemName=golang.Go) and you are good to go.

### Makefile

```bash
# Build the cli
make build
# lint the code
make lint
# run the tests
make test
# for more commands run
make help
```

## Guidelines

1. Write [effective Go](https://go.dev/doc/effective_go)
2. Write library code that can be easilly executed in the "frontend" e.g. cli, web, etc.
3. Configuration in library code should be externalized (to be able to use viper)
4. Use dependency injection to make testing easier
5. New code must be covered by unit tests -> Leads to instant feedback
6. New code must be covered by integration tests -> Leads to instant mocks and integration feedback

## Folder structure

```plain
.
├── DEVELOPMENT.md
├── README.md
├── cmd                             # Contains all executables
│   └── cli                         # Contains the cli executable (could also be split into multiple executables)
│       ├── exec                    # Contains the cli exec logic
│       │   └── exec.go         
│       ├── main.go
│       └── translate               # Contains the cli translate logic
│           └── translate.go
├── internal                        # Contains all internal code (buisness logic) -> e.g. creating the execution matrix out of a config and dispatching it to some executor
└── pkg                             # Contains all library code (e.g. configuration, logger, executor, etc.)
    ├── configuration           
    │   ├── config.go
    │   └── versions
    │       ├── v1
    │       │   ├── config.go
    │       │   └── config_test.go
    │       └── v2
    │           ├── config.go
    │           └── config_test.go
    └── logger
        └── logger.go
```

## Testing


### General
- Naming convention `TestNameOfFunction` (without `_`'s)
- each `Test` function should contain at least one `Run` section that explains what is tested e.g. `t.Run("should create root folder")`. The words within the brackets should build a sentence.

### Integration Tests
- Integration tests validate the interaction and compatibility of different components in our application.
- Files needed in the tests are stored in a `testdata` folder (inside the package)
- Integration tests can be executed running `make test` or make `integration-tests`
- Integration tests should end with the term `Integration` in their names e.g. `TestNameOfFunctionIntegration`
- Golden files are used to store expected output (in the `testdata` folder), and an update flag is available for updating them if needed. Golden files should have the `.golden` file extension.
	```go
	var (
		update = flag.Bool("update", false, "update the golden files of this test")
	)
	```
	- The update flag can be used to update the golden files
	```bash
	go test --tags integration ./path/to/your/test -update
	```

### Unit Tests
- Unit tests validate individual units of code, such as functions or methods.
- Test files and other necessary resources are stored in the `testdata` folder.
- The `t.Parallel()` function is used for tests that can run concurrently to improve execution speed.
- The goal is to achieve test coverage of over 90%.
- The `got/want` structure is used when it makes sense to compare actual and expected values.
- In order to run them use `make test` or `make unit-tests`
- Golden files are used to store expected output, and an update flag is available for updating them if needed. Golden files should have the `.golden` file extension.

### Fuzz Testing
- Fuzz testing is performed to identify vulnerabilities and unexpected behaviors in our application.
- More information about fuzz testing can be found at [https://go.dev/security/fuzz/](https://go.dev/security/fuzz/)


## Release

### Prerequisites

- Install [goreleaser](https://goreleaser.com/install/)

### Build

In order to build a release run `make release` and the binaries will be available in the `dist` folder.

## Help

- [cobra](https://github.com/spf13/cobra/blob/main/user_guide.md)
- [viper](https://github.com/spf13/viper)