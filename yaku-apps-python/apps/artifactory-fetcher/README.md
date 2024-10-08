# artifactory-fetcher

This autopilot is used for fetching a single file or directory from a JFrog Artifactory.
It downloads the file(s) and places it/them in the evidence_path directory.

It also performs a SHA256 Checksum check on the downloaded file and stops if
there is an error.
