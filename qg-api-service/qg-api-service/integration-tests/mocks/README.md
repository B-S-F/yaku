### Generate qg-result.yaml mocks

Each `qg-result.yaml` result used in integration tests has an associated `qg-config.yaml` config file.

The naming convention used is `qg-{type}-${number-of}-findings-${overallStatus}-status.yaml`, i.e. the config file which is expected to generate 0 Findings and a GREEN overallStatus after a run is named `qg-config-0-findings-green-status.yaml` and associated with the `qg-result-0-findings-green-status.yaml` result file.

For generating the result files you could:

- setup [localdev](../../../localdev/README.md) and run `generate-results.sh` or
- create configs manually on the deployed service and extract result file from the evidence folder
