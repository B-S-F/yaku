# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import pytest
from mock import patch
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


filter_config_file_data = ""


def test_create_on_premise_sharepoint(settings):
    settings.is_cloud = False
    list_title_property_map = []
    on_premise_sharepoint = SharePointFetcherFactory.selectSharepointInstance(
        settings, list_title_property_map, filter_config_file_data
    )
    assert on_premise_sharepoint is not None


@patch("yaku.sharepoint_fetcher.cloud.connect.Connect._sharepoint_cloud_instance_connect")
def test_create_cloud_sharepoint(mock_connect, settings):
    mock_connect.return_value = {"Authorization": "Bearer your_token"}

    settings.is_cloud = True
    list_title_property_map = []
    cloud_sharepoint = SharePointFetcherFactory.selectSharepointInstance(
        settings, list_title_property_map, filter_config_file_data
    )

    assert cloud_sharepoint is not None
