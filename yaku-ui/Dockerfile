# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

#############
# PRODUCTION
#############

ARG BASE_IMAGE_NODEJS_NAME="node:20-alpine"
ARG BASE_IMAGE_NGINX_NAME="nginx:1.27.2-alpine-slim"
FROM ${BASE_IMAGE_NODEJS_NAME} as app-builder

ARG VITE_TEST_RUN_FEATURE="true"
ARG VITE_TEST_RELEASE_PLANNING_FEATURE="true"
ARG VITE_TEST_RELEASE_EMAILS="true"
ARG VITE_TEST_TASK_MANAGEMENT="true"
ARG VITE_TEST_VUETIFY_UI="true"

ENV NODE_ENV=development


ENV APP_GROUP_NAME=node
ENV APP_USER_NAME=node
ENV APP_USER_ID=1000
ENV APP_USER_HOME=/home/node


ENV PATH=$PATH:$APP_USER_HOME/node_modules/.bin

USER ${APP_USER_NAME}
WORKDIR ${APP_USER_HOME}/app

COPY --chown=${APP_USER_NAME}:${APP_USER_NAME} . .
RUN npm ci --ignore-scripts

RUN npm rebuild node-sass && NODE_OPTIONS=--max-old-space-size=8192 npm run build


FROM ${BASE_IMAGE_NGINX_NAME} as production

LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU ui docker image based on nginx:1.27.2-alpine-slim"

ARG VITE_TEST_RUN_FEATURE="true"
ARG VITE_TEST_RELEASE_PLANNING_FEATURE="true"
ARG VITE_TEST_RELEASE_EMAILS="true"
ARG VITE_TEST_TASK_MANAGEMENT="true"
ARG VITE_TEST_VUETIFY_UI="true"

USER root

ENV APP_GROUP_NAME=node
ENV APP_USER_NAME=node
ENV APP_USER_ID=1000
ENV APP_USER_HOME=/home/node
ENV NGINX_TLS_ENABLE=false
ENV NGINX_LOG_ENABLE_ACCESS_LOGS=true
ENV NGINX_HEADER_SIZE=64k
ENV NGINX_PORT=8080

WORKDIR ${APP_USER_HOME}/app

COPY --chown=${APP_USER_NAME}:${APP_USER_NAME} --from=app-builder ${APP_USER_HOME}/app/qg-service-ui/dist /usr/share/nginx/html/
COPY --chown=nginx:nginx ./qg-service-ui/.docker/default.conf.template /etc/nginx/conf.d/default.conf

USER root

EXPOSE 8080
ENTRYPOINT [ "nginx", "-g", "daemon off;"]
