#!/usr/bin/env bash

help() {
  echo "Usage:"
  echo ""
  echo "  $0 [--query] [--resolve] APP"
  echo ""
  echo "  When run with --query, this script doesn't print anything but sets the exit code"
  echo "  to non-zero if no changes can be found. If run without --query, the exit code is"
  echo "  always zero."
  echo ""
  echo "  The --resolve flag activates the invocation of pants to find dependencies for"
  echo "  an app directory so that changes in their Git history are also considered."
  echo ""
  echo "Example:"
  echo ""
  echo "  $0 apps/splunk-fetcher"
  echo ""
  echo "Advanced usage:"
  echo ""
  echo "  Print changelog for all apps:"
  echo '    for app in $(find apps/ -maxdepth 1 -mindepth 1 -type d); do echo ">>>>>>>> $app <<<<<<<<" ; '$0' $app; done'
  echo ""
  echo "  Print changelog for all apps (including pants dependencies):"
  echo '    for app in $(find apps/ -maxdepth 1 -mindepth 1 -type d); do echo ">>>>>>>> $app <<<<<<<<" ; '$0' --resolve $app; done'
  echo ""
  echo "  Check if app directories have had changes since their last release tag:"
  echo '    for app in $(find apps/ -maxdepth 1 -mindepth 1 -type d); do '$0' --query $app && echo "Changes found for $app"; done'
  echo ""
  echo "  Check if app directories have had changes since their last release tag and print changelog:"
  echo '    for app in $(find apps/ -maxdepth 1 -mindepth 1 -type d); do '$0' --query $app && ( echo ">>>>>>>> $app <<<<<<<<" ; '$0' $app; ); done'
  echo ""
  echo "  Check if app directories have had changes since their last release tag (include pants dependencies):"
  echo '    for app in $(find apps/ -maxdepth 1 -mindepth 1 -type d); do '$0' --query --resolve $app && ( echo ">>>>>>>> $app <<<<<<<<" ; '$0' $app; ); done'
  echo ""
  echo ""
}

get_args() {
  ARG=$1
  while [ "${ARG:0:2}" == "--" ]; do
    if [ "$ARG" == "--query" ]; then
      QUERY_MODE=yes
    fi
    if [ "$ARG" == "--resolve" ]; then
      RESOLVE=yes
    fi
    shift
    ARG=$1
  done
  APP=${ARG}
}

check_args() {
  if [ -z "${APP}" ]; then
    help
    exit 1
  fi

  if [ ! -d "${APP}" ]; then
    echo "Error: given app is not a directory: ${APP}."
    echo ""
    help
    exit 1
  fi

  if [ ! -f pants.toml ]; then
    echo "Error: no pants.toml found. Are you running this script from the repo root directory?"
    exit 1
  fi
}

get_args $*
check_args

# get latest git tag for app
LATEST_TAG=$(git tag | grep "${APP}/" | grep -v "old-" | sort --version-sort | tail -n 1)
if [ -z "${LATEST_TAG}" ]; then
  echo "Error: could not get latest tag for app '${APP}'. Using full history of this app."
fi

# get log for app since latest tag
if [ -n "${LATEST_TAG}" ]; then
  if [ -n "${RESOLVE}" ]; then
    # use pants to find dependencies of our app and related changes
    SOURCES=$(pants dependencies --transitive ${APP}:: | grep -v '#' | cut -f1 -d\: | sort -u)
    LOG=$(git log --oneline ${LATEST_TAG}..HEAD $(echo $SOURCES))
    CONTRIBUTORS=$(git log --pretty=format:"%an (%aE)" ${LATEST_TAG}..HEAD $(echo $SOURCES) | sort -u)
  else
    LOG=$(git log --oneline ${LATEST_TAG}..HEAD ${APP})
    CONTRIBUTORS=$(git log --pretty=format:"%an (%aE)" ${LATEST_TAG}..HEAD ${APP} | sort -u)
  fi
else
  LOG=$(git log --oneline ${APP})
  CONTRIBUTORS=$(git log --pretty=format:"%an (%aE)" ${APP} | sort -u)
fi
if [ -z "${LOG}" ]; then
  COUNT=0
else
  COUNT=$(echo "${LOG}" | wc -l)
fi

if [ -z "${QUERY_MODE}" ]; then
  echo "Branch head has ${COUNT} commit(s) related to ${APP} since latest tag ${LATEST_TAG}"
fi

if [ "${COUNT}" -gt 0 ]; then
  if [ -z "${QUERY_MODE}" ]; then
    echo "Changes:"
    echo "${LOG}" | awk '{print " * " $0}'
    echo "Contributors:"
    echo "${CONTRIBUTORS}" | awk '{print " * " $0}'
    echo ""
  fi
  exit 0
else
  if [ -n "${QUERY_MODE}" ]; then
    exit 2
  fi
  echo ""
fi
