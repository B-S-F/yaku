import pytest
from yaku.sharepoint_fetcher.config import Settings
from yaku.sharepoint_fetcher.sharepoint_factory import SharePointFetcherFactory


@pytest.fixture
def settings():
    return Settings(
        sharepoint_site="project_site",
        sharepoint_path="project_path/",
        username="username",
        password="password",
        tenant_id="tenant_id",
        client_id="client_id",
        client_secret="client_secret",
        destination_path="destination_path",
        download_properties_only=False,
        sharepoint_file="file/",
    )


config_file_data = ""


def test_create_on_premise_sharepoint(settings):
    settings.is_cloud = False
    list_title_property_map = []
    on_premise_sharepoint = SharePointFetcherFactory.selectSharepointInstance(
        settings, list_title_property_map, config_file_data
    )
    assert on_premise_sharepoint is not None


def test_create_cloud_sharepoint(settings):
    settings.is_cloud = True
    list_title_property_map = []
    cloud_sharepoint = SharePointFetcherFactory.selectSharepointInstance(
        settings, list_title_property_map, config_file_data
    )
    assert cloud_sharepoint is not None
