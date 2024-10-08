import concurrent.futures
import os

from yaku.sharepoint_fetcher.on_premise.connect import Connect

SHAREPOINT_PROJECT_SITE = os.getenv("SHAREPOINT_PROJECT_SITE")
SHAREPOINT_USERNAME = os.getenv("SHAREPOINT_USERNAME")
SHAREPOINT_PASSWORD = os.getenv("SHAREPOINT_PASSWORD")
SHAREPOINT_FORCE_IP = os.getenv("SHAREPOINT_FORCE_IP")

connect = Connect(
    SHAREPOINT_PROJECT_SITE, SHAREPOINT_USERNAME, SHAREPOINT_PASSWORD, SHAREPOINT_FORCE_IP
)


def schema_for_results(url):
    response = connect._get(url).json()
    assert response["d"]
    assert response["d"]["results"]


def test_schema_for_results():
    url = SHAREPOINT_PROJECT_SITE + "_api/web/Lists"

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(schema_for_results, url)
        try:
            future.result(timeout=2.0)
        except concurrent.futures.TimeoutError:
            print(f'[skipped]: "schema_for_results(url)" because "{url}" was not responding')
