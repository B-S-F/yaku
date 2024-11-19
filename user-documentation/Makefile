# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

# Minimal makefile for Sphinx documentation
#
SHELL=bash
.PHONY: default
default: help

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= .venv/bin/sphinx-build
SOURCEDIR     = source
BUILDDIR      = build

CORE_OPENAPI_SPEC     := source/reference/rest-api/core-api/openapi.yaml

DIVIDER := -----------------------------------------------------------------

# Put it first so that "make" without argument is like "make help".
.PHONY: help
help:
	@if [ -f $(SPHINXBUILD) ]; then $(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O) ; fi
	@echo
	@echo "Other targets:"
	@echo
	@echo "  prepare          Set up virtual environment, install and prepare Sphinx"
	@echo "                   (if you want to update the requirements.lock file, just delete it)"
	@echo "  checklinks       Check if external links in the documentation are still pointing to"
	@echo "                   valid URLs. (Ignored URLs are listed in 'checklinks.ignore' file)"
	@echo "  fnlint           Check filenames for correct style."
	@echo "  lint             Check for style errors in Markdown files."
	@echo "  watch            Build HTML documentation, watch for code changes, serve site with live"
	@echo "                   HTTP server and auto-reload pages on changes."
	@echo "  openapi          Update the locally cached OpenAPI specification from the web service."
	@echo "  docker-image     Build documentation Docker image and run the container."

.PHONY: prepare
prepare: make-virtualenv requirements.lock
	if compgen uv; then \
		uv pip install -r requirements.lock ; \
	else \
		.venv/bin/pip install -r requirements.lock; \
	fi

requirements.lock: requirements.txt
	if compgen uv; then \
		uv pip install -r requirements.txt ; \
		uv pip freeze > requirements.lock ; \
	else \
		.venv/bin/pip install -r requirements.txt ; \
		.venv/bin/pip freeze > requirements.lock ; \
	fi

.PHONY: make-virtualenv
make-virtualenv:
	rm -rf .venv
	if compgen uv; then uv venv --python 3.12; else python3.12 -m venv .venv; fi

.PHONY: checklinks
checklinks:
	@{ \
	while read url; do \
	  if ! 'grep' -l -R "$${url}" source/ > /dev/null; then \
	    echo "URL $${url} is not used anywhere in source/. Please remove it from the checklinks.ignore file!"; \
	    exit 1; \
	  fi; \
	done < checklinks.ignore ;\
	}
	@echo "The following links are external links in the documentation which cannot be accessed."
	@echo "Please check if you can open them in your browser."
	@echo ""
	@echo "If you are sure that the URL is working although it is listed below, you"
	@echo "can ignore the URL for the future by putting it into the 'checklinks.ignore' file."
	@echo ""
	@echo "${DIVIDER}"
	@echo ""
	@make singlehtml 1>/dev/null
	@sed -n 's/.*href="\([^"]*\).*/\1/p' build/singlehtml/index.html | grep -e '^http[s]://' | sort -u | grep -Fvxf checklinks.ignore > /tmp/checklinks
	@{ \
	while read -r url ; do \
	  url=$$(python3 -c "import sys,html; print(html.unescape(sys.argv[1]))" "$${url}") ;\
	  curl -sSLIf "$${url}" 1>/dev/null || echo -e "FAIL: $${url}\n\n${DIVIDER}\n" ;\
	done < /tmp/checklinks ;\
	}

.PHONY: watch
watch: $(CORE_OPENAPI_SPEC)
	.venv/bin/sphinx-autobuild --ignore '*.swp' "$(SOURCEDIR)" "$(BUILDDIR)/autobuild" $(SPHINXOPTS) $(O)

.PHONY: openapi
openapi:
	@if [ -f $(CORE_OPENAPI_SPEC) ]; then rm $(CORE_OPENAPI_SPEC); fi
	@$(MAKE) $(CORE_OPENAPI_SPEC)

$(CORE_OPENAPI_SPEC):
	curl -o $(CORE_OPENAPI_SPEC) -L https://yaku-dev.bswf.tech/docs-yaml

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
.DEFAULT: Makefile
	@if [ ! -f $(CORE_OPENAPI_SPEC) ]; then $(MAKE) $(CORE_OPENAPI_SPEC); fi
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: docker-image
docker-image: html
	@docker build -t docs -f docker-image/Dockerfile .
	@set -m; docker run -it --rm -p 8888:8080 docs & \
	  (sleep 1 ; python3 -m webbrowser http://localhost:8888 ) && fg

# -d MD013 disables the max line length = 80 characters linting
.PHONY: lint
lint:
	npx -y markdownlint-cli --disable MD013 MD029 MD033 -- 'source/**/*.md'


.PHONY: fnlint
fnlint:
	@echo Running filename linter...
	@DELIM=~~~ ;\
	FILES=$$(find source/ -iname '*' -type f ! -path '*/fonts/*' -printf "%f$${DELIM}%p\n") ;\
	WRONG=() ;\
	ERROR=0 ;\
	while read -r f; do \
	  P=$${f##*$${DELIM}} ;\
	  F=$${f%%$${DELIM}*} ;\
	  if [[ ! "$${F}" =~ [a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z]+ ]]; then \
	    WRONG+=($${P}) ;\
	  fi ;\
	done <<< $${FILES} ;\
	if [[ "$${#WRONG[@]}" > 0 ]]; then \
	  ERROR=1 ;\
	  echo "There are files with invalid name (not kebab-case):" ;\
	  for f in "$${WRONG[@]}"; do \
	    echo - $${f} ;\
	  done ;\
	fi ;\
	DIRS=$$(find source/ -iname '*' -type d ! -printf "%f$${DELIM}%p\n") ;\
	WRONG=() ;\
	while read -r D; do \
	  if [[ ! "$${D}" =~ [a-z][a-z0-9]*(-[a-z][0-9]+)* ]]; then \
	    WRONG+=($${D}) ;\
	  fi ;\
	done <<< $${DIRS} ;\
	if [[ "$${#WRONG[@]}" > 0 ]]; then \
	  ERROR=1 ;\
	  echo "There are directories with invalid name (not kebab-case):" ;\
	  for d in "$${WRONG[@]}"; do \
	    echo - $${f} ;\
	  done ;\
	fi ;\
	echo "Done." ;\
	exit $${ERROR}
