<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Authentication

The REST API requires a valid bearer token for most endpoints.
The REST API expects the bearer token in the http Auhtorization header.

curl example:

```bash
curl -H "Authorization: Bearer placeholder-token" ...
```

You have to replace `placeholder-token` with an actual token.

## Types of bearer tokens

There are two types of valid bearer tokens:

- OAuth based access tokens
- long running application tokens

### OAuth based access tokens

OAuth based access tokens are issued by our authentication / authorization service after you have logged in with your user.
The Yaku web portal and the yaku-cli support fetching OAuth based access tokens.

These access tokens expire after a couple of minutes and need to be refreshed.
The Yaku web portal and the yaku-cli take care of refreshing.

After 10 hours, refreshing is not possible and in interactive login is again necessary.

Example usage with the yaku-cli:

```bash
yaku login --web
```

### Long running application tokens

Long running application tokens are issued by Yaku itself.
You have to be interactively logged in with your user to create a long running application token.

The long running application tokens do not expire, but can be revoked, if necessary.

Changes to a user's permissions are visible after at most 60 seconds when using long running application tokens.

For example:

You use a technical user with a long running application token for your automations.
You grant access to a new namespace to the technical user.
Requests to that new namespace made with the long running application token may be declined by the Yaku service up to one minute after granting access to the technical user.

### When to use which bearer token type

You should use long running application tokens only for automation tasks that run unattended.

For every other use case, including working interactively with the cli, you should use OAuth based access tokens.

As the long running application tokens do not expire, they pose a security risk, if they are compromised and not revoked.

Therefore, you should have as few long running application tokens as possible and copy them to as few places as possible.

If you have any questions about bearer tokens and bearer token use, please do not hesitate to contact our customer support.

## Admin permissions

A user may have the admin role for administering a whole Yaku instance.

When regularly working with the Yaku portal, the cli or the swagger UI, the user does not have admin permissions active.

To activate the admin permissions, the user has to specifically request them.

Example usage with the yaku-cli:

```bash
yaku login --web --admin
```

For the swagger UI, you have to check the "global" checkbox when fetching OAuth based access tokens.

The Yaku portal does currently not support activating admin permissions.

### Admin permissions for long running application tokens

Long running application tokens do not activate admin permissions by default.

If you want a long running application token to activate admin permissions, you have to set the "try_admin" flag to "true" when creating the token.

Please note: Even if you set the "try_admin" flag to "true", the token can only activate admin permissions when the user has the admin role.

You can create a long running application token with the "try_admin" flag set to "true" although you do not have the admin role, but the token will not be able to activate the admin permissions.

If at any later point in time, the user is granted the admin role, the token will activate admin permissions automatically for each request done with the token.

Long running application tokens where the "try_admin" flag is set to "false" (the default) will never activate admin permissions.

## Issuing long running application tokens

### Via the Swagger UI

To issue long running application tokens via the Swagger UI, do the following:

1. Direct your browser to the swagger UI endpoint of your Yaku service instance
2. Log in via OAuth
3. Use the swagger UI to create a new long running application token
4. Note the token down, as you will not be able to see the token value again

### Via the cli

To issue long running application tokens via the yaku cli, do the following:

1. Login with the `--web` switch
2. Use the "tokens" subcommand to create a token
3. Note the token down, as you will not be able to see the token value again

Please consult also the help of the tokens subcommand

Example:

```bash
yaku login --web
yaku tokens create "Token for GitHub automation without activating admin permissions"
```
