#!/bin/bash

# Check if the required parameters are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Usage: $0 <workflow-id> <repo-name> <github-token>"
    exit 1
fi

# Workflow ID, repository name, and GitHub token passed as arguments
WORKFLOW_ID=$1
REPO=$2
GITHUB_TOKEN=$3

# Fetch the workflow runs and get the created_at timestamp of the most recent run
LAST_RUN_TIMESTAMP=$(curl -s \
                                   -H "Authorization: token $GITHUB_TOKEN" \
                                   -H "Accept: application/vnd.github.v3+json" \
                                   "https://api.github.com/repos/B-S-F/$REPO/actions/workflows/$WORKFLOW_ID/runs" | \
                                   jq -r '.workflow_runs[0].created_at')

# Convert the given date to Unix timestamp
given_date_timestamp=$(perl -MTime::Piece -E "say Time::Piece->strptime('$LAST_RUN_TIMESTAMP', '%Y-%m-%dT%H:%M:%SZ')->epoch")

# Get the current date in Unix timestamp
current_date_timestamp=$(date -u +%s)

# Calculate the difference in seconds
time_difference=$((current_date_timestamp - given_date_timestamp))

# Convert the difference from seconds to days
days_difference=$((time_difference / 86400))

# Set the output variable
echo "$days_difference"

