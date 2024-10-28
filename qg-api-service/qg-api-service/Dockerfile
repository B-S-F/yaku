###################
# BUILD FOR LOCAL DEVELOPMENT
###################

ARG BASE_IMAGE_NODEJS_NAME=node:22-alpine

FROM ${BASE_IMAGE_NODEJS_NAME} As development

WORKDIR /app
COPY . ./
RUN npm ci -ws --include-workspace-root

###################
# BUILD FOR PRODUCTION
###################

ARG BASE_IMAGE_NODEJS_NAME=node:22-alpine

FROM ${BASE_IMAGE_NODEJS_NAME}  As build

ENV PATH=$PATH:/app/node_modules/.bin \
    NODE_ENV=development \
    SKIP_HUSKY=1

RUN apk --no-cache add zip
WORKDIR /app

COPY --from=development /app/node_modules ./node_modules
COPY . .

RUN npm config set ignore-scripts false
RUN npm run build
RUN npm ci -ws --include-workspace-root --omit=dev && npm cache clean --force

###################
# PRODUCTION
###################

ARG BASE_IMAGE_NODEJS_NAME=node:22-alpine

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

ENV PATH=$PATH:/node_modules/.bin


RUN mkdir /data

WORKDIR /app

COPY qg-api-service/examples ./qg-api-service/examples
COPY --from=build  /app/node_modules ./node_modules
COPY --from=build  /app/qg-api-service/dist ./qg-api-service/dist
COPY --from=build  /app/api-commons-lib/dist ./api-commons-lib/dist
COPY --from=build  /app/api-keycloak-auth-lib/dist ./api-keycloak-auth-lib/dist
COPY --from=build  /app/qg-api-service/node_modules ./qg-api-service/node_modules
COPY --from=build  /app/api-commons-lib/node_modules ./api-commons-lib/node_modules
COPY --from=build  /app/api-keycloak-auth-lib/node_modules ./api-keycloak-auth-lib/node_modules
COPY --from=build  /app/qg-api-service/package.json ./qg-api-service/package.json

EXPOSE ${PORT}

CMD [ "node", "qg-api-service/dist/main.js" ]