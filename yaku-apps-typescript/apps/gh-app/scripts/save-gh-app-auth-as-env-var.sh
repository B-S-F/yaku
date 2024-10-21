#!/bin/bash
# This is an example script how to save the GitHub App authentication token as an environment variable
# before using the GH CLI
# Needed environment variables:
# - GH_APP_ID=<app_id>
# - GH_APP_PRIVATE_KEY=<private_key>
# - GH_APP_ORG=<github_org>
# - GH_APP_REPO=<github_repo>

set -e
output=$(gh-app auth)
token=$(echo $output | grep -oP 'GITHUB_TOKEN":"\K[^"]+')
export GITHUB_TOKEN=$token
# Now you can use the GH CLI
