ARG BASE_IMAGE_NODEJS_NAME

FROM ${BASE_IMAGE_NODEJS_NAME}

ARG GROUP_NAME=qguser
ARG GROUP_ID=1000
ARG USERNAME=qguser
ARG USER_ID=1001
ARG USER_HOME=/home/qguser
ARG VERSION=latest
ENV IMAGE_VERSION=$VERSION
ENV PORT=8080

LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="Tooling for performing the user migration"

RUN apt-get --yes --force-yes update && apt-get --yes --force-yes install openjdk-17-jre python3 python3-pip libpq5 wget curl vim
WORKDIR /opt
RUN wget https://github.com/keycloak/keycloak/releases/download/23.0.7/keycloak-23.0.7.tar.gz
RUN tar -xzf keycloak-23.0.7.tar.gz

ENV PATH="$PATH:/opt/keycloak-23.0.7/bin"

RUN pip3 install psycopg

RUN mkdir /scripts
WORKDIR /scripts

COPY 1-precondition-check.py /scripts/
COPY 2-data-migration.py /scripts/
