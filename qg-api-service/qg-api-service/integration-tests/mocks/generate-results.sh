#!/bin/bash

export NODE_NO_WARNINGS=1
# show created resources
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

YAKU_ENV_NAME=local-myuser

# test if expected yaku environment exists
if [[ $(yaku envs ls -j | jq -r --arg YAKU_ENV_NAME "${YAKU_ENV_NAME}" 'map(select(.name == $YAKU_ENV_NAME) | .name)[0]') == "${YAKU_ENV_NAME}" ]];
then
    yaku envs sw "${YAKU_ENV_NAME}"
else
    echo -e "${RED}Environment '${YAKU_ENV_NAME}' not found!${NC}"
    echo -e "${RED}Please make sure localdev is properly set up!${NC}"
    exit 1
fi

for CONFIG_FILE in $(ls qg-config-*);
do
    echo -e "${BLUE}############################################${NC}"
    echo
    echo -e "Processing configuration file ${BLUE}${CONFIG_FILE}${NC}"

    # create configuration name
    CONFIG_NAME=$(echo "${CONFIG_FILE}" | sed 's/.yaml//')-$(dd if=/dev/urandom count=1 status=none | sha256sum | cut -b 1-8 )
    echo -e "Creating configuration named ${BLUE}${CONFIG_NAME}${NC}"

    # create configuration
    CONFIG_ID=$(yaku cfg c "${CONFIG_NAME}" | jq -r '.id')
    echo -e "Successfully created configuration with id ${BLUE}${CONFIG_ID}${NC}"

    # upload configuration file
    yaku files add -f "qg-config.yaml" "${CONFIG_ID}" "${CONFIG_FILE}"

    # start a run
    RUN_ID=$(yaku runs create --wait --poll-interval 1 "${CONFIG_ID}"| jq -r '.id')
    echo -e "Successfulyy completed run with id ${BLUE}${RUN_ID}${NC}"

    # download run result
    yaku runs result "${RUN_ID}"
    RESULT_FILE=$(echo "${CONFIG_FILE}" | sed 's/qg-config/qg-result/g')
    mv qg-result.yaml "${RESULT_FILE}"
    echo -e "Created result file ${BLUE}${RESULT_FILE}${NC}"
    echo
done;
