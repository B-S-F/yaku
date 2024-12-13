#!/bin/bash

# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

# generate an admin login session
npm run start -w ../yaku-cli -- login --url http://127.0.0.1:3000/api/v1 --namespace 1 --admin local-myadmin

# create namespace
NAMESPACE_ID=$(npm run start -w ../yaku-cli -- namespaces create mynamespace 2>/dev/null | tail -n +5 | jq -r '.id')

# create local yaku cli env
npm run start -w ../yaku-cli -- envs create local-myuser --url http://127.0.0.1:3000/api/v1 --web --namespace $NAMESPACE_ID
npm run start -w ../yaku-cli -- envs sw local-myuser

# show created resources
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo ""
echo -e "${BLUE}############################################${NC}"
echo -e "${BLUE}############################################${NC}"
echo ""
echo -e "Created the following resources:"
echo -e "${BLUE}- Namespace:${NC}"
echo "   - id: $NAMESPACE_ID"
echo "   - name: mynamespace"
echo -e "${BLUE}- Yaku CLI Environments:${NC}"
echo "   - local-myuser"
echo ""
echo -e "${BLUE}############################################${NC}"
echo -e "${BLUE}############################################${NC}"
