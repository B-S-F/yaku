###################
# BUILD FOR LOCAL DEVELOPMENT
###################

ARG BASE_IMAGE_NAME="node:18-alpine"

FROM ${BASE_IMAGE_NAME} As development

USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . .
RUN npm install -ws --include-workspace-root

###################
# BUILD FOR PRODUCTION
###################

ARG BASE_IMAGE_NAME="node:18-alpine"

FROM ${BASE_IMAGE_NAME}  As build


RUN apk --no-cache add zip

ENV PATH=$PATH:/home/node/app/node_modules/.bin

WORKDIR /home/node/app

COPY --from=development /home/node/app/node_modules ./node_modules
COPY . .

RUN npm config set ignore-scripts false
RUN npm run build
RUN npm ci -ws --include-workspace-root --omit=dev && npm cache clean --force

RUN chown -R node:node /home/node/app
USER node

###################
# PRODUCTION
###################

ARG BASE_IMAGE_NAME="node:18-alpine"

FROM ${BASE_IMAGE_NAME}  As production

ARG VERSION=latest
ENV IMAGE_VERSION=$VERSION
ENV PORT=8080

LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU core-api docker image based on node image"

ENV PATH=$PATH:/app/node_modules/.bin

RUN mkdir /data && chown -R node:node /data
WORKDIR /home/node/app


COPY qg-api-service/examples ./qg-api-service/examples
COPY --from=build  /home/node/app/node_modules ./node_modules
COPY --from=build  /home/node/app/qg-api-service/dist ./qg-api-service/dist
COPY --from=build  /home/node/app/qg-api-service/package.json ./qg-api-service/package.json
COPY --from=build  /home/node/app/api-commons-lib/dist ./api-commons-lib/dist
COPY --from=build  /home/node/app/api-commons-lib/package.json ./api-commons-lib/package.json
COPY --from=build  /home/node/app/api-keycloak-auth-lib/dist ./api-keycloak-auth-lib/dist
COPY --from=build  /home/node/app/api-keycloak-auth-lib/package.json ./api-keycloak-auth-lib/package.json

EXPOSE ${PORT}

WORKDIR /home/node/app/qg-api-service
RUN chown -R node:node /home/node/app

USER node
CMD ["node", "dist/main.js" ]
