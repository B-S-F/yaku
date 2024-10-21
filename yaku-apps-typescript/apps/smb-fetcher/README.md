# SMB Fetcher

## Setup the environment variables

After doing the [Installation and Build step](../../README.md#installation) make a copy of the `.env.sample` template

```sh
cp .env.sample .env
```

Set the required environment variables in `.env`

```sh
SMB_USERNAME=
SMB_PASSWORD=
SMB_CONFIG_PATH=
```

Export them to the current shell with

```sh
export $(grep -v '^#' .env | xargs -0)
```

| Environment Variable | Description                         |
| -------------------- | ----------------------------------- |
| SMB_USERNAME         | SMB Share username                  |
| SMB_PASSWORD         | SMB Share password                  |
| SMB_CONFIG_PATH      | SMB Fetcher configuration file path |

## Configuration file

The SMB Fetcher will read `SMB_CONFIG_PATH` configuration `yaml` file which contains SMB Share information

For a given POSIX path to a SMB Share in the form of `smb://host.gTLD/path/to/smb/shared/resource` the configuration file must contain the NT path form:

```yaml
share: '\\host.gTLD\path'
domain: 'NT-DOMAIN-OF-SMB-SHARE'
files:
  - 'to\smb\shared\resource'
  - 'to\smb\shared\another\resource'
```
