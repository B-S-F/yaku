COVERAGE_XML_FILE=dist/coverage/python/coverage.xml
COVERAGE_TMP_BASE_DIR=dist/coverage
COVERAGE_TMP_DIR=$(mktemp -d -p ${COVERAGE_TMP_BASE_DIR})

# create temp dir
mkdir -p ${COVERAGE_TMP_BASE_DIR}
COVERAGE_TMP_DIR_NAME=$(basename ${COVERAGE_TMP_DIR})

# get list of files from coverage xml file
xmllint --xpath //@filename ${COVERAGE_XML_FILE} | sed -e 's/^\s*filename="\(.*\)"$/\1/' | grep -v "__global_coverage__" | sort > ${COVERAGE_TMP_DIR}/covered-files.txt

# get list of all Python files
find apps -name "*.py" -not -path '*/tests/*' -not -path '*/tests-pex/*' -not -path '*/tests-integration/*' | sort > ${COVERAGE_TMP_DIR}/all-files.txt
find packages -name "*.py" -not -path '*/tests/*' -not -path '*/tests-pex/*' -not -path '*/tests-integration/*' | sort >> ${COVERAGE_TMP_DIR}/all-files.txt

# compare the two lists of files and print difference
echo -n "\n\n=======================================================================\n"
echo "The following files are not contained in the coverage report:\n\n"
diff --changed-group-format='%<%>' --unchanged-group-format='' ${COVERAGE_TMP_DIR}/covered-files.txt ${COVERAGE_TMP_DIR}/all-files.txt
echo -n "=======================================================================\n"

# clean up temporary directory
rm -rf dist/coverage/${COVERAGE_TMP_DIR_NAME}
