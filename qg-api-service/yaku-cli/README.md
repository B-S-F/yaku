# Yaku CLI Documentation

## User documentation

### Installation

#### Linux/MacOS

Download the file **yaku-cli.zip** from the [core service release](https://github.com/B-S-F/qg-api-service/releases) and unzip it to the current folder. Call `npm install -g ./yaku-cli/B-S-F-yaku-cli-<version>.tgz ./yaku-cli/B-S-F-yaku-client-lib-<version>.tgz`. The yaku cli will be installed in the path and you can use it by simply calling `yaku` in a shell.

#### Windows
Download the file **yaku-cli.zip** from the [core service release](https://github.com/B-S-F/qg-api-service/releases) and unzip it to the current folder. The extracted files are two `.tgz` archives. Extracting those will result in two `.tar` files. Call `npm i -g ./B-S-F-yaku-cli-<version>.tar ./B-S-F-yaku-client-lib-<version>.tar`. The yaku cli will be installed in the path and you can use it by simply calling `yaku` in a shell.

### Using the CLI

The Yaku CLI contains commands to run requests against the Yaku service REST API. To start using the cli, run `yaku login`. This will lead you through a series of prompts which will help authenticate, set up or select an environment and select a namespace.

Use `yaku -h` to get a list of all available commands and subcommands.

The help option also explains all commands and subcommands. Detailed help on a certain command can be retrieved, by a `yaku command subcommand -h` call, e.g., for help on listing runs, you can type `yaku runs list -h` or short `yaku r ls -h`. Most commands come with abbreviations to reduce the amount of typing needed to issue a request.

### Fixing TLS issues

The Yaku CLI may fail with `Statuscode: 600`, when the Yaku CLI cannot validate the server's TLS certificate due to missing CA certificates.

The Yaku CLI implements TLS via standard nodejs functionality.
If your Yaku API TLS endpoints' certificates are signed by internal certificate authorities (CAs), you have to make these CAs' certificates discoverable by nodejs.

nodejs reads the environment variable `NODE_EXTRA_CA_CERTS` and adds the certificates in the referenced file to its in-memory trust store.
See the [corresponding nodejs documentation](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).

Get a copy of the needed CA certificates in PEM (human-readable) format and concatenate the certificates into one file.
Set the `NODE_EXTRA_CA_CERTS` environment variable to the file's path and start the YAKU CLI.

The YAKU CLI should now successfully connect to your API endpoint.

#### Bosch internal TLS certificates

You can find the Bosch internal TLS certificates in the Bosch intranet.

Search the term `Bosch internal SSL certificates` with the enterprise search and download the zip file with the certificates.
Concatenate all the certificates with `pem` in their name into one file as described above.

## Developer documentation

### Using the CLI

The CLI is made up of two parts: the CLI itself and the client library. The client library is a wrapper around the REST API of the Yaku service. The CLI is a wrapper around the client library and provides a command-line interface to interact with the Yaku service.

Both the client-lib and the yaku-cli have to be built in order for the CLI to work locally. Afterwards, any CLI command can be run with `npm run start -- <command>`. The `--` argument [acts as a delimiter](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html#tag_12_02), indicating the end of options for the npm command and the beginning of the arguments for the script.

### Integration Tests

The integration tests can be found in the [cli directory](./test/cli) within the test folder. Call `npm run test` to launch them via the CLI.

Mocks for HTTP requests are stored within the [fixture directory](./test/fixtures). The term fixtures herein refers to mock responses for HTTP requests.

It is recommended to create a separate fixture-file for each endpoint. Each fixture file includes one or multiple method, that returns the corresponding mock server options. Those can be used to start the mock Server, then.
