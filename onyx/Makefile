.PHONY: help
help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  build                         to build the CLI"
	@echo "  ci-build                      to build the CLI for CI"
	@echo "  test                          to run the tests"
	@echo "  test-coverage                 to run the tests and get the coverage"
	@echo "  unit-tests                    to run the unit tests"
	@echo "  unit-tests-coverage           to run the unit tests and get the coverage"
	@echo "  integration-tests             to run the integration tests"
	@echo "  integration-tests-coverage    to run the integration tests and get the coverage"
	@echo "  tidy                          to tidy the go modules"
	@echo "  lint                          to lint the code"
	@echo "  lint-fix                      to lint the code and fix the issues"
	@echo "  fmt                           to format the code"
	@echo "  setup                         to setup the project"
	@echo "  release                       to release the project"


CLI_NAME=onyx
COVERAGE_FOLDER=coverage
RESULTS_FOLDER=results

.PHONY: build
build:
	go build -o bin/$(CLI_NAME) cmd/cli/main.go

.PHONY: test
test: unit-tests integration-tests

.PHONY: test-coverage
test-coverage: unit-tests-coverage integration-tests-coverage

.PHONY: unit-tests
unit-tests:
	go test --tags unit -v ./...
	
.PHONY: unit-tests-coverage
unit-tests-coverage:
	mkdir -p $(RESULTS_FOLDER)
	mkdir -p $(COVERAGE_FOLDER)
	go test --tags unit -coverpkg=./... -race -coverprofile=$(COVERAGE_FOLDER)/cover.out -covermode=atomic -v 2>&1 ./... | go-junit-report -set-exit-code > $(RESULTS_FOLDER)/unit-tests.xml
	gocov convert $(COVERAGE_FOLDER)/cover.out > $(COVERAGE_FOLDER)/coverage.json
	cat $(COVERAGE_FOLDER)/coverage.json | gocov report > $(COVERAGE_FOLDER)/coverage.txt
	echo "$(shell go tool cover -func=$(COVERAGE_FOLDER)/cover.out | grep total | awk '{print $$3}' | sed 's/%//')" > $(COVERAGE_FOLDER)/totalcoverage.txt
	cat $(COVERAGE_FOLDER)/coverage.json | gocov-xml > $(COVERAGE_FOLDER)/coverage.xml

.PHONY: integration-tests
integration-tests:
	go test --tags integration -v ./...

integration-tests-coverage:
	mkdir -p $(RESULTS_FOLDER)
	mkdir -p $(COVERAGE_FOLDER)
	go test -tags integration -coverpkg=./... -race -coverprofile=$(COVERAGE_FOLDER)/int-cover.out -covermode=atomic -v 2>&1 ./... | go-junit-report -set-exit-code > $(RESULTS_FOLDER)/integration-tests.xml
	gocov convert  $(COVERAGE_FOLDER)/int-cover.out > $(COVERAGE_FOLDER)/integration-coverage.json
	cat $(COVERAGE_FOLDER)/integration-coverage.json | gocov report > $(COVERAGE_FOLDER)/integration-coverage.txt
	echo "$(shell go tool cover -func=$(COVERAGE_FOLDER)/int-cover.out | grep total | awk '{print $$3}' | sed 's/%//')" > $(COVERAGE_FOLDER)/integration-totalcoverage.txt	
	cat $(COVERAGE_FOLDER)/integration-coverage.json | gocov-xml > $(COVERAGE_FOLDER)/integration-coverage.xml

.PHONY: tidy
tidy:
	go mod tidy

.PHONY: lint
lint:
	golangci-lint run

.PHONY: lint-fix
lint-fix:
	golangci-lint run --fix

.PHONY: fmt
fmt:
	go fmt ./...

.PHONY: setup
setup:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.52.2
	go install github.com/axw/gocov/gocov@v1.1.0
	go install github.com/AlekSi/gocov-xml@latest
	go install github.com/jstemmer/go-junit-report/v2@latest
	# Testing tools for the future
	# go get -u github.com/golang/mock/mockgen 
	# go get -u github.com/onsi/ginkgo/ginkgo
	# go get -u github.com/onsi/gomega/...

.PHONY: setup-locally
setup-locally: install-hooks setup
install-hooks: remove-hooks
	cicd/pre-commit-install
	ln -s ../../cicd/commit-msg-hook .git/hooks/commit-msg
remove-hooks:
	rm -f .git/hooks/commit-msg
	rm -f .git/hooks/pre-commit

.PHONY: release
release:
	goreleaser release --clean