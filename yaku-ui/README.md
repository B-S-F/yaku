<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Yaku UI

1. `npm install -ws --include-workspace-root` Install dependencies
2. Adjust the `ui-dev-config.json` file to your needs
```json
{
  "environments": [
    {
      "label": "Localhost",
      "slug": "localhost",
      "url": "http://localhost:3000", // your api url
      "keycloakConfig": {
        "url": "https:/localhost:15333/auth", // your keycloak authorization server url
        "realm": "dev", // your keycloak realm
        "clientId": "yaku-portal" // your keycloak client id
      }
    }
  ]
}
```
3. `npm run dev` Start development server
4. Open the url displayed in the console in your browser
