# splunk-fetcher

The splunk-fetcher will fetch the outputs from splunk via search queries. It is a small CLI that can be used to define everything you need to fetch data from splunk via a search query. To see some help just run the CLI via:

```
python src/yaku/splunk_fetcher/cli.py --help
```

You should see something like this:

```
Usage: splunk-fetcher [OPTIONS]

  Fetch Splunk query result as JSON or CSV

Options:
  --version                       Output version information and exit.
  --colors / --no-colors          Enable or disable colors in output.
  --debug                         Show debug log messages.
  -q, --query TEXT                Splunk query
  --validate-results BOOLEAN      Validate amount of received results. Does
                                  not work with one shot searches
  -f, --file TEXT                 File that contains the Splunk query
  -a, --app TEXT                  Splunk app name  [required]
  -u, --username TEXT             Splunk username  [required]
  -p, --password TEXT             Splunk password  [required]
  -h, --host TEXT                 Splunk host
  -P, --port INTEGER              Splunk port
  -o, --output-format [json|csv|xml]
                                  Output format  [default: json]
  --force                         Force the overwrite of the output file
  -r, --result-file TEXT          Splunk result file
  --oneq-upload                   Upload the result to OneQ
  --animations / --no-animations  Disable animations
  --one-shot / --no-one-shot      One shot search
  --start-time TEXT               Start time for one shot search e.g.
                                  2021-01-01
  --end-time TEXT                 End time for one shot search e.g. 2021-01-01
  --help                          Show this message and exit.
```
