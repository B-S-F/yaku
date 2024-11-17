#!/bin/bash

set -e

realm=$1
namepsace_id=$2

if [ -z "$realm" ]; then
  echo "Usage: $0 <realm name> <NAMESPACE_X> where X is the namespace number"
  exit 1
fi

if [ -z "$namepsace_id" ]; then
  echo "Usage: $0 <realm name> <NAMESPACE_X> where X is the namespace number"
  exit 1
fi

client_name=NAMESPACE_$namepsace_id

if [ -z "${namepsace_id//[0-9]}" ]; then
  echo "Will create client $client_name."
else
  echo "The client id should be a number"
  exit 1
fi

# Check if the client exists
client_exists=$(kcadm.sh get clients -r $realm --fields clientId | grep -o $client_name | wc -l)
if [[ $client_exists -gt 0 ]]; then
  echo "Can't create client $client_name. It already exists!"
  exit 1
else
  echo "Client $client_name does not exist"
fi

# Create the client
kcadm.sh create clients -r $realm -b '{
  "clientId": "'$client_name'",
  "name": "'$client_name'",
  "description": "Client for namespace '$namespace_id'",
  "enabled": false,
  "clientAuthenticatorType": "client-secret",
  "redirectUris": [],
  "webOrigins": [],
  "bearerOnly": false,
  "consentRequired": false,
  "standardFlowEnabled": false,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  "publicClient": true,
  "frontchannelLogout": true,
  "protocol": "openid-connect",
  "fullScopeAllowed": true
}'


# Get client id
client_id=$(kcadm.sh get clients -r $realm | jq -r --arg NAME "$client_name" '.[] | select(.clientId==$NAME) | .id')

# Create ACCESS role
kcadm.sh create clients/$client_id/roles -r $realm -s name=ACCESS -s "description=Grants basic access to the namespace"

client_scope_name=$(echo $client_name | tr '[:upper:]' '[:lower:]')

# Create client scope
kcadm.sh create client-scopes -r $realm -s name=$client_scope_name -s "description=Roles of ${client_name}" -s protocol="openid-connect" -s includeInTokenScope=false -s type=Default

# Get id of created client scope
client_scope_id=$(kcadm.sh get client-scopes -r $realm | jq -r --arg NAME "$client_scope_name" '.[] | select(.name==$NAME) | .id')

echo "Client scope id: $client_scope_id"

#kcadm.sh update clients/$client_id  -r $realm -b '{ "defaultClientScopes": ["'${client_scope_name}'"]} '


# Create role mapper
kcadm.sh create client-scopes/$client_scope_id/protocol-mappers/models -r $realm  -b '{ 
  "name": "client roles", 
  "protocol": "openid-connect", 
  "protocolMapper": "oidc-usermodel-client-role-mapper", 
  "consentRequired": false, 
  "config": { 
    "multivalued": true, 
    "userinfo.token.claim": false, 
    "id.token.claim": false, 
    "access.token.claim": true, 
    "claim.name": "resource_access.${client_id}.roles", 
    "usermodel.clientRoleMapping.clientId": "'$client_name'" 
    } 
  }'

# Add client scope to clients: clients: yaku-cli, yaku-core, yaku-core-swagger and yaku-portal

yaku_core_id=$(kcadm.sh get clients -r $realm | jq -r '.[] | select(.clientId=="yaku-core") | .id')
yaku_core_swagger_id=$(kcadm.sh get clients -r $realm | jq -r '.[] | select(.clientId=="yaku-core-swagger") | .id')
yaku_cli_id=$(kcadm.sh get clients -r $realm | jq -r '.[] | select(.clientId=="yaku-cli") | .id')
yaku_portal_id=$(kcadm.sh get clients -r $realm | jq -r '.[] | select(.clientId=="yaku-portal") | .id')

kcadm.sh update clients/$client_id/default-client-scopes/$client_scope_id -r $realm -b "{\"defaultClientScopes\": [\"$client_scope_name\"]}"
kcadm.sh update clients/$yaku_core_id/default-client-scopes/$client_scope_id -r $realm -b "{\"defaultClientScopes\": [\"$client_scope_name\"]}"
kcadm.sh update clients/$yaku_core_swagger_id/default-client-scopes/$client_scope_id -r $realm -b "{\"defaultClientScopes\": [\"$client_scope_name\"]}"
kcadm.sh update clients/$yaku_cli_id/default-client-scopes/$client_scope_id -r $realm -b "{\"defaultClientScopes\": [\"$client_scope_name\"]}"
kcadm.sh update clients/$yaku_portal_id/default-client-scopes/$client_scope_id -r $realm -b "{\"defaultClientScopes\": [\"$client_scope_name\"]}"

echo "Client ${client_name} was created successfully!"