# Sharepoint

A cli tool to interact with sharepoint

## Usage

```plain
Usage: sharepoint [OPTIONS] COMMAND [ARGS]...

Options:
  --version  Output version information and exit
  --help     Show this message and exit.

Commands:
  upload-files   Upload files to SharePoint.
  upload-folder  Upload a folder to SharePoint.
```

### Upload files

The cli can be used to upload files to sharepoint.
The files will be uploaded to the Sharepoint instance specified by the environment variable `SHAREPOINT_URL`.
Authentication is done using the environment variables `SHAREPOINT_USERNAME` and `SHAREPOINT_PASSWORD`.
The files will be uploaded to the path specified by the `--sharepoint-path` option.

```plain
Usage: sharepoint upload-files [OPTIONS]

  Upload files to SharePoint.

Options:
  --file TEXT                 File to upload  [required]
  -p, --sharepoint-path TEXT  SharePoint path  [required]
  -f, --force                 Force upload even if file exists
  --help                      Show this message and exit.
```

```bash
export SHAREPOINT_URL="https://mycompany.sharepoint.com/sites/my-site"
export SHAREPOINT_USERNAME="my-username"
export SHAREPOINT_PASSWORD="my-password"
sharepoint upload-files --file "my-file.txt" --file "my-file2.txt --sharepoint-path "Documents"
```

### Upload folder

The cli can be used to upload a folder to sharepoint.
This includes all files and sub folders recursively.
The folder will be uploaded to the Sharepoint instance specified by the environment variable `SHAREPOINT_URL`.
Authentication is done using the environment variables `SHAREPOINT_USERNAME` and `SHAREPOINT_PASSWORD`.
The folder will be uploaded to the path specified by the `--sharepoint-path` option.

```plain
Usage: sharepoint upload-folder [OPTIONS] FOLDER

  Upload a folder to SharePoint.

Options:
  -p, --sharepoint-path TEXT  SharePoint path  [required]
  -f, --force                 Force upload even if folder exists
  --help                      Show this message and exit.
```

```bash
export SHAREPOINT_URL="https://mycompany.sharepoint.com/sites/my-site"
export SHAREPOINT_USERNAME="my-username"
export SHAREPOINT_PASSWORD="my-password"
sharepoint upload-folder --folder "my-folder" --sharepoint-path "Documents"
```

## Environment variables

| Name                | Description                            | Default | Required |
| ------------------- | -------------------------------------- | ------- | -------- |
| SHAREPOINT_URL      | The url of the sharepoint instance     | NONE    | YES      |
| SHAREPOINT_USERNAME | The username to use for authentication | NONE    | YES      |
| SHAREPOINT_PASSWORD | The password to use for authentication | NONE    | YES      |
| SHAREPOINT_FORCE_IP | IP address of the SharePoint server    | NONE    | NO       |


The environment variable `SHAREPOINT_FORCE_IP` can be used to override the IP address
in case DNS name resolution is broken.

When using this workaround, the `no_proxy` variable should be set to the same IP
address, so that no proxy is used for connecting to that IP address.
