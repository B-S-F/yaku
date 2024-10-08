# User migration scripts

## Data sanitation in Keycloak

This is a deployment specific step.
Please contact Yaku support for help.

## Create an admin user in Keycloak

Create a new user in Keycloak with a strong password that has the `view-users` and `query-users` roles of the `realm-management` client.

From here on, this document refers to the admin user as `adminuser`.

## Update the Yaku service to version 0.55.0

## Shutdown the Yaku service

The following scripts need a consistent and steady state.
Please shutdown the Yaku servie (at least the core API) to achieve that.

## Create a backup of the Yaku database

Create a backup of the Yaku database.

## Get JSON with Keycloak user information

If you are using a proxy service, set the `KC_OPTS` environment variable to configure the `kcadm.sh` tool. Example:

```
export KC_OPTS='-Dhttps.proxyHost=10.0.2.2 -Dhttps.proxyPort=3128'
```

Log into the keycloak with `kcadm.sh`:

```
kcadm.sh config credentials --server https://{url}/{path - if any} --realm {realm} --user adminuser
```

Example:

```
kcadm.sh config credentials --server https://authz.example.com/auth --realm realm-dev --user adminuser
```

After a successful login, please fetch all users with their information from Keycloak:

```
kcadm.sh get users --fields 'id,username,email,enabled,attributes(display_name)' --limit 1000 > users.json
```

Set `limit` to a value greater or equal than the number of users in your realm.

## Determine and improve data quality

Run the first script `1-precondition-check.py` to validate the data received.
The script will output any deviations that may impact the later script(s).

```
./1-precondition-check.py users.json
```

Example output:

```
Retrieved 133 users
Broken:  <redacted 1>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 2>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 3>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 4>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 5>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 6>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 7>         Reason: no attributes / display_name   Enabled: False
Broken:  adminuser            Reason: no email                       Enabled: True
Broken:  adminuser            Reason: no attributes / display_name   Enabled: True
Broken:  <redacted 8>         Reason: no attributes / display_name   Enabled: False
Broken:  <redacted 9>         Reason: no attributes / display_name   Enabled: False
```

For each output line, correct the data in Keycloak.
You can ignore the warnings that correspond to your admin user.

If you want to ignore the warnings for other users, you do that at your own risk.
The following scripts will try to work with incomplete data, but we do not provide any guarantees.

## Perform the data migration

The data migration script `2-data-migration.py` needs the following environment variables:

- DB_HOST --- database server host, e.g. prod-database-cluster.com
- DB_PORT --- database server port, e.g. 5432
- DB_USE_SSL --- whether the connection to the database server should use SSL, true or false
- DB_NAME --- the database name
- DB_USERNAME --- the username of the user with read and write access to the database
- DB_PASSWORD --- the password of the user with read and write access to the database

In addition, you can set the log level of the script with the environment variable `LOGLEVEL`.
The default is `DEBUG`, the other sensible option is `INFO`.
We recommend to stick with the default.

Please note, the script generates approximately four log lines per row in the database with `DEBUG`.
With `INFO`, the script generates less than 100 log lines in total.

We also recommend to store the log of the script (stdout and stderr) in a file for later inspection.

```
./2-data-migration.py users.json
```

## Restart the service

Restart the Yaku service and perform some smoke testing.
