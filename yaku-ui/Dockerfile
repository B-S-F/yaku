#############
# PRODUCTION
#############

ARG BASE_IMAGE_NODEJS_NAME="node:20-alpine"
ARG BASE_IMAGE_NGINX_NAME="nginx:1.27.2-alpine-slim"
FROM ${BASE_IMAGE_NODEJS_NAME} as app-builder

ARG VITE_TEST_RUN_FEATURE
ARG VITE_TEST_RELEASE_PLANNING_FEATURE
ARG VITE_TEST_RELEASE_EMAILS
ARG VITE_TEST_TASK_MANAGEMENT
ARG VITE_TEST_VUETIFY_UI

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

ARG VITE_TEST_RUN_FEATURE
ARG VITE_TEST_RELEASE_PLANNING_FEATURE
ARG VITE_TEST_RELEASE_EMAILS
ARG VITE_TEST_TASK_MANAGEMENT
ARG VITE_TEST_VUETIFY_UI

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

COPY --from=app-builder ${APP_USER_HOME}/app/dist /usr/share/nginx/html/
COPY --from=app-builder ${APP_USER_HOME}/app/package.json package.json
COPY --chown=nginx:nginx ./qg-service-ui/.docker/default.conf.template /etc/nginx/conf.d/default.conf

USER root

EXPOSE 8080
ENTRYPOINT [ "nginx", "-g", "daemon off;"]
