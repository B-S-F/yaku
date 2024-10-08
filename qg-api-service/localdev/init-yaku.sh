#!/bin/bash

# create namespace
NAMESPACE_ID=$(yaku namespaces create mynamespace | jq -r '.id')

# create local yaku cli env
yaku envs create local-myuser --url http://127.0.0.1:3000/api/v1 --web --namespace $NAMESPACE_ID
yaku envs sw local-myuser

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
