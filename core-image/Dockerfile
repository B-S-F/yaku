# Base image: Ubuntu 22.04

ARG BASE_IMAGE_NAME=ubuntu:22.04

FROM ${BASE_IMAGE_NAME} AS production

LABEL "repository"="https://github.com/B-S-F/yaku"
LABEL maintainer="Neutrinos GROW/PAT"
LABEL description="YAKU core docker image based on Ubuntu 22.04 image"

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=18
ARG USERNAME="qguser"
ARG USER_UID=1001
ARG USER_GID=1000

RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd -s /bin/bash --uid ${USER_UID} --gid ${USER_GID} -m "${USERNAME}"

RUN set -ex pipefail \
    && apt-get -yq update \
    && apt-get install -y --no-install-recommends \
        bash-completion \
        ca-certificates \
        curl \
        fontconfig \
        git \
        gnupg \
        jq \
        libxml2-utils \
        python3 \
        python3-pip \
        python3-venv \
        python-is-python3 \
        unzip \
        xfonts-utils \
        xz-utils \
    && echo "Installing nodejs ${NODE_VERSION}" \
        && mkdir -p /etc/apt/keyrings | curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
        && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
        && apt-get update -y && apt-get install nodejs -y \
    # Install Trivy is currently broken see https://github.com/aquasecurity/trivy-repo/issues/32
    # && apt-get install -y apt-transport-https gnupg lsb-release \
    # && curl https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add - \
    # && echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | tee -a /etc/apt/sources.list.d/trivy.list \
    # && apt-get update \
    # && apt-get install trivy \
    && echo "Cleaning image..." \
    && apt-get clean \
    && rm -rf /var/cache/* \
    && rm -rf /var/lib/apt/lists/* \
    && echo "Cleaned image"

# Install GH CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt update \
    && apt install gh -y

# Install yq
RUN curl -fsSL https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 > /usr/local/bin/yq \
    && chmod +x /usr/local/bin/yq

# Install htmlq
RUN curl -fsSL https://github.com/mgdm/htmlq/releases/latest/download/htmlq-x86_64-linux.tar.gz > htmlq.tar.gz \
    && tar -xzvf htmlq.tar.gz -C /usr/local/bin

# Install trivy workaround
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.56.2

ADD --chown=${USER_UID}:${USER_GID} ./onyx/bin "/home/${USERNAME}/bin"
ADD --chown=${USER_UID}:${USER_GID} ./yaku-apps-python/dist/apps.*/*.pex "/home/${USERNAME}/bin"
RUN for file in /home/${USERNAME}/bin/*.pex; do mv "$file" /home/${USERNAME}/bin/"$(basename ${file} .pex)"; done
ADD --chown=${USER_UID}:${USER_GID} ./yaku-apps-typescript/node_modules "/home/${USERNAME}/node_modules"
# ADD --chown=${USER_UID}:${USER_GID} ./latest-versions.json "/home/${USERNAME}/app-versions.json"


ENV NODE_ENV=production

USER ${USERNAME}

ENV PATH="/home/${USERNAME}/node_modules/.bin:/home/${USERNAME}/bin:${PATH}"

RUN mkdir "/home/${USERNAME}/mnt"
WORKDIR /home/${USERNAME}/mnt
CMD [ "qg", "generate" ]


FROM production as development

ARG USERNAME="qguser"
ARG USER_UID=1001
ARG USER_GID=1000

ENV PATH="/home/${USERNAME}/node_modules/.bin:/home/${USERNAME}/yaku-apps-typescript/node_modules/.bin:/home/${USERNAME}/bin:${PATH}"

ADD --chown=${USER_UID}:${USER_GID} ./yaku-apps-typescript "/home/${USERNAME}/yaku-apps-typescript"

WORKDIR /home/${USERNAME}/mnt
CMD [ "qg", "generate" ]
