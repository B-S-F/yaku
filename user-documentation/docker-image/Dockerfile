# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

FROM nginx:1.24.0

COPY ./docker-image/nginx-files/nginx.conf /etc/nginx/nginx.conf
COPY ./docker-image/nginx-files/default.conf /etc/nginx/conf.d/default.conf
COPY ./build/html /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

CMD ["nginx", "-g", "daemon off;"]
