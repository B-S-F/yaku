poetry_requirements(
    name="reqs",
    module_mapping={
        "splunk_sdk": ["splunklib"],
    },
)

pex_binary(
    name="splunk-fetcher",
    entry_point="yaku.splunk_fetcher.cli",
)
