import csv
import io
import json

from loguru import logger
from splunklib import results as sr


class SplunkResult:
    # Overrides have to be added,
    # as the results in the reader do not contain empty columns, which are expected so far
    def __init__(
        self,
        reader: sr.JSONResultsReader,
        override_csv: bytes | None = None,
        override_json: bytes | None = None,
    ):
        self.messages: list[dict] = []
        self.results: list[dict] = []
        self.fieldnames: list[str] = []
        self.override_csv: bytes | None = None
        self.override_json: bytes | None = None

        logger.info("Processing SplunkResult ...")
        for item in reader:
            logger.debug(f"Processing item {item}")
            if isinstance(item, dict):
                self.results.append(item)
            elif isinstance(item, sr.Message):
                self.messages.append(
                    {
                        "type": item.type,
                        "text": item.message,
                    }
                )
            else:
                logger.warning(f"Unexpected item type {item}")

        self.fieldnames = self._get_fieldnames(self.results)
        logger.debug(f"Calculated result fields {self.fieldnames}")
        if override_csv is not None:
            logger.debug("Received override_csv")
            self.override_csv = override_csv
        if override_json is not None:
            logger.debug("Received override_json")
            self.override_json = override_json
        self._is_valid()

    def _is_valid(self):
        if len(self.results) == 0:
            for message in self.messages:
                logger.debug(message)
            logger.warning("Splunk did not return any results")

    def _get_fieldnames(self, rows: list[dict]) -> list[str]:
        unique_keys = set()
        for row in rows:
            for key in row.keys():
                unique_keys.add(key)
        fieldnames = list(unique_keys)
        fieldnames.sort()
        return fieldnames

    def __len__(self) -> int:
        return len(self.results)

    def to_json(self) -> str:
        if self.override_json is not None:
            logger.debug("Using override_json over internal")
            return self.override_json.decode()
        transformed = {
            "results": self.results,
            "messages": self.messages,
            "fields": [dict(name=fieldname) for fieldname in self.fieldnames],
        }
        return json.dumps(transformed)

    def to_csv(self) -> str:
        if self.override_csv is not None:
            logger.debug("Using override_csv over internal")
            return self.override_csv.decode()
        transformed = io.StringIO()
        writer = csv.DictWriter(transformed, fieldnames=self.fieldnames)
        writer.writeheader()
        writer.writerows(self.results)
        return transformed.getvalue()
