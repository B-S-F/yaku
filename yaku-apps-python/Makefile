.PHONY: help
help:
	@echo "Targets:"
	@echo ""
	@echo "   install-fast-hooks       Set up Git hooks (linting, formatting)"
	@echo "   install-slow-hooks       Set up Git hooks (linting, formatting, tests)"
	@echo "   remove-hooks             Uninstall Git hooks"
	@echo ""
	@echo "   vscode-integration       Set up VS Code so that it works nicely with Pants"
	@echo "   update-lockfiles         Update Python lockfiles for Pants"
	@echo ""
	@echo "   format                   Run formatters"
	@echo "   lint                     Run linters (e.g. in CI/CD pipeline)"
	@echo "   test                     Run tests (e.g. in CI/CD pipeline)"
	@echo "   testcov                  Run tests with coverage analysis"
	@echo "   testint                  Run integration tests only (for external systems)"
	@echo "   check                    Run checks (e.g. in CI/CD pipeline)"
	@echo "   package                  Package everything"
	@echo ""
	@echo "   coverage-check           Compare list of Python files with coverage analysis files"
	@echo "   check-release-workflow   Compare list of apps in release workflow with apps directory"
	@echo ""

FOLDER ?= '.'
.PHONY: install-slow-hooks install-fast-hooks remove-hooks
install-fast-hooks: remove-hooks install-std-hooks
	ln -s ../../cicd/pre-commit-hook-fast .git/hooks/pre-commit
install-slow-hooks: remove-hooks install-std-hooks
	ln -s ../../cicd/pre-commit-hook-slow .git/hooks/pre-commit
install-std-hooks: remove-hooks
	ln -s ../../cicd/commit-msg-hook .git/hooks/commit-msg
remove-hooks:
	rm -f .git/hooks/commit-msg
	rm -f .git/hooks/pre-commit

.PHONY: vscode-integration
vscode-integration: vscode-python-paths vscode-virtualenvs

.PHONY: vscode-virtualenvs
vscode-virtualenvs:
	pants export \
		--py-resolve-format=symlinked_immutable_virtualenv \
		--resolve=python-default
	export LATEST_PYTHON_VERSION=$$(ls -1 dist/export/python/virtualenvs/python-default | sort | tail -n 1) ; \
	export PYTHON_PREFIX=dist/export/python/virtualenvs/python-default/$${LATEST_PYTHON_VERSION}/ ; \
	if yq -V > /dev/null; then \
		yq -oj -i '."python.defaultInterpreterPath" = "'$${PYTHON_PREFIX}'bin/python"' .vscode/settings.json ; \
		yq -oj -i '."python.testing.pytestPath" = "'$${PYTHON_PREFIX}'bin/pytest"' .vscode/settings.json ; \
		yq -oj -i '."mypy-type-checker.interpreter" = ["'$${PYTHON_PREFIX}'bin/python"]' .vscode/settings.json ; \
	else \
		echo "No 'yq' installed. Please adapt python.defaultInterpreterPath and python.testing.pytestPath" ; \
		echo "manually in .vscode/settings.json." ; \
	fi

.PHONY: vscode-python-paths
vscode-python-paths:
	python3 cicd/check-vscode-python-paths.py

.PHONY: _generate_lockfiles
_generate_lockfiles:
	pants generate-lockfiles

.PHONY: _convert_lockfile
_convert_lockfile:
	grep -A1000000 -e '^[^/]' 3rdparty/python-lockfile.txt| jq -r '.locked_resolves[].locked_requirements[] | [ .project_name, .version ] | join("==") ' | LC_ALL=C sort -d -s > dependabot-requirements.txt

.PHONY: update-lockfiles
update-lockfiles: _generate_lockfiles _convert_lockfile

.PHONY: test
test:
	pants --tag="-integration" test ${FOLDER}/::

.PHONY: testcov
testcov:
	pants --tag="-integration" test --use-coverage --coverage-py-filter=${FOLDER} ${FOLDER}/::

.PHONY: testint
testint:
	pants --tag="integration" test ${FOLDER}/::

.PHONY: lint
lint:
	pants lint ::

.PHONY: check
check:
	pants check ::

.PHONY: fmt format
fmt: format
format:
	pants fmt ::

.PHONY: package
package:
	pants package ${FOLDER}/::

.PHONY: coverage-check
coverage-check: testcov
	cicd/coverage-check.sh

.PHONY: check-release-workflow
check-release-workflow:
	python3 cicd/check-release-workflow.py
