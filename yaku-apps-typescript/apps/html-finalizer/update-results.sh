#!/bin/bash

# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

# This script updates the qg-result.yaml files for th html-finalizer app

HTML_FINALIZER_PATH=$(dirname $0)
RESULT_FILE_NAME="qg-result.yaml"
CONFIG_FILE_PATH="${HTML_FINALIZER_PATH}/sample/qg-config.yaml"
FIND_ALL_RESULT_FILES=$(find ${HTML_FINALIZER_PATH} -name ${RESULT_FILE_NAME})
IGNORED_PATHS="test/integration/input/v1-with-logs"
RELEVANT_PATHS=$(echo ${FIND_ALL_RESULT_FILES} | tr " " "\n" | grep -v ${IGNORED_PATHS})

# Test if onyx is installed

which onyx >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Onyx is not installed. Please install it first."
    echo "https://github.com/B-S-F/onyx"
    exit 1
fi

# Test if yq is installed

which yq >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "yq is not installed. Please install it first."
    echo "brew install yq"
    exit 1
fi

# Test if CONFIG_FILE_PATH exists

if [ ! -f "${CONFIG_FILE_PATH}" ]; then
    echo "The config file does not exist: ${CONFIG_FILE_PATH}"
    exit 1
fi

# Create a tmp directory to store the new result file

TMP_DIR=$(mktemp -d -t html-finalizer-XXXXXXXXXX)
echo "Created tmp directory: ${TMP_DIR}"
cp ${CONFIG_FILE_PATH} ${TMP_DIR}
cd ${TMP_DIR}
touch .secrets
touch .vars
onyx exec .
cd -
NEW_RESULT_FILE=$(find ${TMP_DIR} -name ${RESULT_FILE_NAME})

ONYX_VERSION=$(onyx --version)

echo "Updating result files..."
echo ""
for result_file in ${RELEVANT_PATHS}; do
    # compare onyx version with header.toolversion
    result_file_tool_version=$(yq -r '.header.toolVersion' ${result_file})
    echo "Checking ${result_file}"
    echo "Onyx version: ${ONYX_VERSION}"
    echo "Result file version: ${result_file_tool_version}"
    if [ "${result_file_tool_version}" == "null" ]; then
        # yq returns null if the key is not found
        echo "The result file is missing the header.toolVersion, skipping as it seems to be a legacy qg result file..."
    elif [ "${result_file_tool_version}" != "${ONYX_VERSION}" ]; then
        echo "The result file is outdated with your local onyx version, updating..."
        cp ${NEW_RESULT_FILE} ${result_file}
    else
        echo "The result file is up to date with your local onyx version, skipping..."
        continue
    fi
    echo ""
done
