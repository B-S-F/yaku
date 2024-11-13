#!/bin/bash

set -e

realm=$1

if [ -z "$realm" ]; then
  echo "Usage: $0 <realm name>"
  exit 1
fi



# Create global client scope
kcadm.sh create client-scopes -r $realm -s name=global -s "description=Roles for Yaku instance administration" -s protocol="openid-connect" -s includeInTokenScope=true -s type=Optional
# Get id of created client scope
global_client_scope_id=$(kcadm.sh get client-scopes -r $realm | jq -r --arg NAME "global" '.[] | select(.name==$NAME) | .id')
echo "Global client scope id: $global_client_scope_id"

# Create role mapper
kcadm.sh create client-scopes/$global_client_scope_id/protocol-mappers/models -r $realm  -b '{ 
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
    "usermodel.clientRoleMapping.clientId": "GLOBAL" 
    } 
  }'


# Create namespace_1 client scope
kcadm.sh create client-scopes -r $realm -s name=namespace_1 -s "description=Roles of namespace_1" -s protocol="openid-connect" -s includeInTokenScope=true -s type=Default
# Get id of created client scope
namespace_1_client_scope_id=$(kcadm.sh get client-scopes -r $realm | jq -r --arg NAME "namespace_1" '.[] | select(.name==$NAME) | .id')
echo "NAMESPACE_1 client scope id: $namespace_1_client_scope_id"

# Create role mapper
kcadm.sh create client-scopes/$namespace_1_client_scope_id/protocol-mappers/models -r $realm  -b '{ 
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
    "usermodel.clientRoleMapping.clientId": "NAMESPACE_1" 
    } 
  }'