# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

update:
	curl https://mkcert.org/generate/ | ./strip-non-ascii > certifi/cacert.pem

publish:
	python -m build
	twine upload --skip-existing --sign dist/*
