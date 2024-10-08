# QG API Service

## Development

### Try it out

- Make sure you are at the root of the repo
- Run `npm install -ws --include-workspace-root` to install all dependencies
- Run `npm start -w qg-api-service` to start the service
- Access the api description at <http://localhost:3000/docs>

### Prepare Database

#### SQLite

First install a sqlite cli e.g. `brew install sqlite3` and then use this [repo](https://github.com/B-S-F/qg-dbinit) to generate two SQL insert statements. With those statements you can create an admin user in the database (you need to provide the JWT secret key as an environment variable to the tool, this can be found in the [config.ts](./src/config.ts) file) The tool will then print the SQL statements
that create an admin user token. You can then use the sqlite cli to insert the user and the token into the database, similar to this:

```bash
sqlite3 <path-to-your-sqlite-file> 'insert into user (username, roles) values ("admin", "admin")'
sqlite3 <path-to-your-sqlite-file>'insert into api_token_metadata ("tokenId", "userId") values ("$2a$05$zzoHodGFmGguogUC1Us1peDh6BMz2QXxyEYIBoEiCIjbiLPam8fPu", 1)'
```

The admin token will also be printed to the console by the [dbinit tool](https://github.com/B-S-F/qg-dbinit) and can be used to add users, tokens and namespaces.

### Postgres

To use postgres locally, the following prerequisites need to be fulfilled:

- Install a postgres database (preferably postgres 13), e.g., by using a container that runs on your local pc, and ensure the reachability of this db for a service running on your local machine
- Prepare a postgres database in your installation with the SQL commands:

  ```
  CREATE DATABASE yaku;
  CREATE ROLE <USER> WITH LOGIN NOSUPERUSER
    INHERIT CREATEDB NOCREATEROLE NOREPLICATION
    PASSWORD '<PASSWORD>';
  GRANT CONNECT ON DATABASE yaku TO <USER>;
  ```

- Set the environment variables:
  - DB_TYPE to 'postgres'
  - DB_HOST to your postgres host, do not use 'localhost' but define an additional name in /etc/hosts for 127.0.0.1 if database is a local installation
  - DB_PORT if you differ from 5432
  - DB_USERNAME if you differ from 'yakuuser'
  - DB_PASSWORD to the password you defined for the user in Postgres
  - DB_NAME if you differ from 'yaku'

After these configurations have been done, start the service. Run the tooling from https://github.com/B-S-F/qg-dbinit as mentioned in [Postgres](#postgres) and insert the generated SQL statements into your database.
The token created by the mentioned tooling can be used to add users, tokens and namespaces to get started.

### Create users, tokens and namespaces

Have a look at the [scripts](../scripts/create-users-ns.sh) to understand how to create users, tokens and namespaces. You can use the admin token that was created in the [Prepare Database](#prepare-database) step to make the requests.
Another possibility is to use the [Yaku CLI](../yaku-cli/).

### minio local

There is a minio instance running in the aqua namespace in each of our clusters. To access it locally, you can establish a port-forward to the minio service, e.g with:

```
kubectl -n argo port-forward deployment/minio 9000:9000 9001:9001
```

### argo local

There is an argo instance running in the aqua namespace in each of our clusters. To access it locally, you can establish a port-forward to the argo service, e.g with:

```
kubectl -n argo port-forward deployment/argo-server 2746:2746
```

### Live debugging

1. Enable the debugger without restarting the pod by executing the following command

```bash
> kubectl exec -it <pod-name> -n <namespace>  -- /bin/sh -c "pkill -USR1 node"
```

2. Stream the pod logs to ensure the debugging is working as expected (Use a separate window as you should keep this open)

```bash
> kubectl logs <pod-name> -n <namespace>  -f
...
Debugger listening on ws://127.0.0.1:9229/496132b9-ec4b-43db-b103-4e15ba80518a
```

3. Port forward the debugger port to your system

```bash
kubectl port-forward <pod-name> -n <namespace>  9229:9229
```

4. Use the `Attach` configuration from the launch.json in order to connect your debugger to the remote pod.

5. Everything should be setup now to debug.
6. To disable the debugger, execute the following command

```bash
> kubectl exec -it <pod-name> -n <namespace>  -- /bin/sh -c "pkill -USR2 node"
```
