###################
# BUILD FOR LOCAL DEVELOPMENT
###################

ARG BASE_IMAGE_NODEJS_NAME

FROM ${BASE_IMAGE_NODEJS_NAME} As development

ARG GROUP_NAME=qguser
ARG GROUP_ID=1000
ARG USERNAME=qguser
ARG USER_ID=1001
ARG USER_HOME=/home/qguser

LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU core-api docker image based on Ubuntu-nodejs"

ENV APP_GROUP_NAME=${GROUP_NAME} \
    APP_GROUP_ID=${GROUP_ID} \
    APP_USER_NAME=${USERNAME} \
    APP_USER_ID=${USER_ID} \
    APP_USER_HOME=${USER_HOME} \
    PATH=$PATH:$APP_USER_HOME/node_modules/.bin \
    NODE_ENV=development

# no upgrade, only update - core image must be up-to-date!
RUN set -uex \
    && umask 0027 \
    && /etc/init.d/setup-user.sh \
    && chown -R ${APP_USER_ID} ${USER_HOME} \
    && chown -R ${APP_USER_ID} /etc/ssl/node

RUN cp /etc/ssl/certs/ca-certificates.crt /etc/ssl/trusted

# switch to app user
USER ${APP_USER_ID}
WORKDIR ${APP_USER_HOME}/app

COPY --chown=${USERNAME}:${USERNAME} package*.json ./

RUN --mount=type=secret,id=npmrc,target=${USER_HOME}/.npmrc,uid=${USER_ID} npm install

COPY --chown=${USERNAME}:${USERNAME} . .

###################
# BUILD FOR PRODUCTION
###################

ARG BASE_IMAGE_NODEJS_NAME

FROM ${BASE_IMAGE_NODEJS_NAME}  As build

ARG GROUP_NAME=qguser
ARG GROUP_ID=1000
ARG USERNAME=qguser
ARG USER_ID=1001
ARG USER_HOME=/home/qguser


LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU core-api docker image based on Ubuntu-nodejs"

ENV APP_GROUP_NAME=${GROUP_NAME} \
    APP_GROUP_ID=${GROUP_ID} \
    APP_USER_NAME=${USERNAME} \
    APP_USER_ID=${USER_ID} \
    APP_USER_HOME=${USER_HOME} \
    PATH=$PATH:$APP_USER_HOME/node_modules/.bin \
    NODE_ENV=development

# no upgrade, only update - core image must be up-to-date!
RUN set -uex \
    && umask 0027 \
    && /etc/init.d/setup-user.sh \
    && chown -R ${APP_USER_ID} ${USER_HOME} \
    && chown -R ${APP_USER_ID} /etc/ssl/node

RUN cp /etc/ssl/certs/ca-certificates.crt /etc/ssl/trusted

RUN apt update -y && apt-get install -y zip


WORKDIR ${APP_USER_HOME}/app

COPY --from=development ${APP_USER_HOME}/app/node_modules ./node_modules
COPY . .

RUN npm config set ignore-scripts false
RUN --mount=type=secret,id=npmrc,target=${APP_USER_HOME}/.npmrc,uid=${APP_USER_ID} npm run build
RUN --mount=type=secret,id=npmrc,target=${APP_USER_HOME}/.npmrc,uid=${APP_USER_ID} npm install --omit=dev && npm cache clean --force

RUN chown -R ${APP_USER_ID} ${APP_USER_HOME}/app

# switch to app user
USER ${APP_USER_ID}

###################
# PRODUCTION
###################

ARG BASE_IMAGE_NODEJS_NAME

FROM ${BASE_IMAGE_NODEJS_NAME} AS production

ARG GROUP_NAME=qguser
ARG GROUP_ID=1000
ARG USERNAME=qguser
ARG USER_ID=1001
ARG USER_HOME=/home/qguser
ARG VERSION=latest
ENV IMAGE_VERSION=$VERSION
ENV PORT=8080

LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU core-api docker image based on Ubuntu-nodejs"

ENV APP_GROUP_NAME=${GROUP_NAME} \
    APP_GROUP_ID=${GROUP_ID} \
    APP_USER_NAME=${USERNAME} \
    APP_USER_ID=${USER_ID} \
    APP_USER_HOME=${USER_HOME} \
    PATH=$PATH:$APP_USER_HOME/node_modules/.bin

# no upgrade, only update - core image must be up-to-date!
RUN set -uex \
    && umask 0027 \
    && /etc/init.d/setup-user.sh \
    && chown -R ${APP_USER_ID} ${APP_USER_HOME} \
    && chown -R ${APP_USER_ID} /etc/ssl/node

RUN cp /etc/ssl/certs/ca-certificates.crt /etc/ssl/trusted

RUN mkdir /data && chown -R ${APP_USER_ID}:${APP_USER_ID} /data


WORKDIR ${APP_USER_HOME}/app


COPY examples ./examples
COPY --from=build  ${APP_USER_HOME}/app/node_modules ./node_modules
COPY --from=build  ${APP_USER_HOME}/app/dist ./dist
COPY --from=build  ${APP_USER_HOME}/app/package.json ./package.json

EXPOSE ${PORT}

RUN chown -R ${APP_USER_ID}:${APP_USER_ID} ${USER_HOME}/app
# switch to app user
USER ${APP_USER_ID}

CMD [ "node", "dist/main.js" ]