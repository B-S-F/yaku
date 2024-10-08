import re
import unittest

import pytest
import requests_mock
from mock import patch
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.sharepoint_fetcher.cloud.connect import Connect


@pytest.fixture
def connect():
    connect = Connect(
        "https://some.sharepoint.server/sites/123456/",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    return connect


def test_initial_value():
    url = "https://sharepoint.com"
    connect = Connect(url, "tenant-id", "client-id", "client-secret")
    assert connect._sharepoint_site == url


def test_missing_trailing_slash_in_url():
    url = "https://sharepoint.com/"
    connect = Connect(url, "tenant-id", "client-id", "client-secret")
    assert connect._sharepoint_site == url[:-1]


class ConnectTest(unittest.TestCase):
    def setUp(self):
        self.mock = requests_mock.Mocker()
        self.mock.start()

    def tearDown(self):
        self.mock.stop()
        self.mock.reset()

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_object(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}

        mock_get_site_id.return_value = "site_id_123"
        site_id = "site_id_123"
        relative_url = "/sites/123456"
        file_name = "File.txt"
        api_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{file_name}?$expand=listItem"

        first_api_response_data = {
            "@microsoft.graph.downloadUrl": "https://example.com/download",
            "size": 17,
        }

        download_url = "https://example.com/download"
        download_url = "https://example.com/download"
        second_api_response_data_content = b"Mock file content"
        self.mock.get(api_url, json=first_api_response_data)
        self.mock.get(
            download_url,
            content=second_api_response_data_content,
        )

        result = connect.get_file_object("/sites/123456", "File.txt", None)

        assert result, second_api_response_data_content

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_object_wrong_size(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}

        site_id = "site_id_123"
        mock_get_site_id.return_value = site_id
        relative_url = "/sites/123456"
        file_name = "File.txt"
        api_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{file_name}?$expand=listItem"

        first_api_response_data = {
            "@microsoft.graph.downloadUrl": "https://example.com/download",
            "size": 1234,
        }

        download_url = "https://example.com/download"
        download_url = "https://example.com/download"
        second_api_response_data_content = b"Mock file content"
        self.mock.get(api_url, json=first_api_response_data)
        self.mock.get(
            download_url,
            content=second_api_response_data_content,
        )

        match = "The downloaded file does not have the proper size: expected 1234 bytes, got 17 bytes! One reason could be that you are behind a proxy/restricted firewall!"
        regex = re.escape(match)
        with pytest.raises(AutopilotError, match=regex):
            connect.get_file_object("/sites/123456", "File.txt", None)

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_object_library(self, mock_session, mock_get_site_id, mock_get_drive_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_drive_id.return_value = "drive_id_123"
        mock_get_site_id.return_value = "site_id_123"

        site_id = "site_id_123"
        relative_url = "/sites/123456"
        file_name = "File.txt"
        drive_id = "drive_id_123"
        api_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{relative_url}/{file_name}?$expand=listItem"

        first_api_response_data = {
            "@microsoft.graph.downloadUrl": "https://example.com/download",
            "size": 17,
        }

        download_url = "https://example.com/download"
        second_api_response_data_content = b"Mock file content"
        self.mock.get(api_url, json=first_api_response_data)
        self.mock.get(
            download_url,
            content=second_api_response_data_content,
        )

        result = connect.get_file_object("/sites/123456", "File.txt", "library_name")
        assert result, second_api_response_data_content

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_folder_id(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
            force_ip="10.0.0.1",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        site_id = "site_id_123"
        folder = "folder"
        api_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{folder}"

        self.mock.get(
            api_url,
            status_code=200,
            json={"id": "folder_id"},
        )

        assert "folder_id" in connect.get_folder_id(folder, None)

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_object_force_ip(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
            force_ip="10.0.0.1",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}

        mock_get_site_id.return_value = "site_id_123"

        site_id = "site_id_123"
        relative_url = "/sites/123456"
        file_name = "File.txt"
        api_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{file_name}?$expand=listItem"

        first_api_response_data = {
            "@microsoft.graph.downloadUrl": "https://example.com/download",
            "size": 17,
        }

        download_url = "https://example.com/download"
        second_api_response_data_content = b"Mock file content"
        self.mock.get(api_url, json=first_api_response_data)
        self.mock.get(
            download_url,
            content=second_api_response_data_content,
        )

        connect.get_file_object("/sites/123456", "File.txt", None)

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_with_401(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root://sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=401,
            json={"error": "Unauthorized access!"},
        )

        url_path = "/sites/123456/test"

        with pytest.raises(AutopilotConfigurationError):
            connect.check_folder_access_and_presence(url_path, None, url_path)

        assert self.mock.call_count == 1
        requested_url = self.mock.last_request.url
        assert api_url in requested_url

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_with_403(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root://sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=403,
            json={"error": "Forbidden"},
        )

        url_path = "/sites/123456/test"

        with pytest.raises(AutopilotConfigurationError):
            connect.check_folder_access_and_presence(url_path, None, url_path)

        assert self.mock.call_count == 1
        requested_url = self.mock.last_request.url
        assert api_url in requested_url

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_with_404(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root://sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=404,
            json={"error": "Not found"},
        )

        url_path = "/sites/123456/test"

        assert connect.check_folder_access_and_presence(url_path, None, url_path) is True

        assert self.mock.call_count == 1
        requested_url = self.mock.last_request.url
        assert api_url in requested_url

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_with_500(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root://sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=500,
            json={"error": "Server error!"},
        )

        url_path = "/sites/123456/test"

        match = 'Internal server error while accessing https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root://sites/123456/test!One reason could be that your PROJECT_PATH does not start with \'Shared Documents/\' (or similar). Please check your settings!\n\nThe server\'s response was: {"error": "Server error!"}'
        regex = re.escape(match)

        with pytest.raises(AutopilotError, match=regex):
            connect.check_folder_access_and_presence(url_path, None, url_path)

        assert self.mock.call_count == 1
        requested_url = self.mock.last_request.url
        assert api_url in requested_url

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_authorized_no_folder(
        self, mock_session, mock_get_site_id
    ):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root:/sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=200,
            json={"not-name": "not-my-folder"},
        )
        url_path = "sites/123456/test"
        assert connect.check_folder_access_and_presence(url_path, None, url_path) is True

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_authorized_parent_folder(
        self, mock_session, mock_get_site_id
    ):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root:/sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=200,
            json={"name": "/sites/123456/test"},
        )
        url_path = "sites/123456/test/subfolder"
        parent_folder = "sites/123456/test"
        message = f"The directory {parent_folder} exists and can be accessed, but {url_path} leads to a non-existing directory! One reason could be that the directory does not exist or you do not have permissions to access that directory path!"
        regex = re.escape(message)

        with pytest.raises(AutopilotError, match=regex):
            connect.check_folder_access_and_presence(parent_folder, None, url_path)

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_check_folder_access_and_presence_authorized(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        api_url = (
            "https://graph.microsoft.com/v1.0/sites/site_id_123/drive/root:/sites/123456/test"
        )
        self.mock.get(
            api_url,
            status_code=200,
            json={"name": "/sites/123456/test"},
        )
        url_path = "sites/123456/test"
        assert connect.check_folder_access_and_presence(url_path, None, url_path) is None

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_folder_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_folders(self, mock_session, mock_get_site_id, mock_get_folder_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )
        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_folder_id.return_value = "folder_id_123"

        response = {"value": [{"name": "subfolder"}]}
        site_id = "site_id_123"
        folder_id = "folder_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/items/{folder_id}/children?$filter=folder ne null",
            json=response,
            status_code=200,
        )

        result = connect.get_folders("/sites/123456/test", None)
        assert "/sites/123456/test/subfolder" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_folder_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_folders_library(
        self, mock_session, mock_get_site_id, mock_get_folder_id, mock_get_drive_id
    ):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )
        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_folder_id.return_value = "folder_id_123"
        mock_get_drive_id.return_value = "drive_id_123"

        response = {"value": [{"name": "subfolder"}]}
        site_id = "site_id_123"
        folder_id = "folder_id_123"
        drive_id = "drive_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{folder_id}/children?$filter=folder ne null",
            json=response,
            status_code=200,
        )

        result = connect.get_folders("/sites/123456/test", "library_name")
        assert "/sites/123456/test/subfolder" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_folders_root(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )
        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        response = {"value": [{"name": "subfolder"}]}
        site_id = "site_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root/children?$filter=folder ne null",
            json=response,
            status_code=200,
        )

        result = connect.get_folders_root(None)
        assert "subfolder" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_folders_root_library(self, mock_session, mock_get_site_id, mock_get_drive_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )
        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_drive_id.return_value = "drive_id_123"

        response = {"value": [{"name": "subfolder"}]}
        site_id = "site_id_123"
        drive_id = "drive_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children?$filter=folder ne null",
            json=response,
            status_code=200,
        )

        result = connect.get_folders_root("library_name")
        assert "subfolder" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_folder_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_files(self, mock_session, mock_get_site_id, mock_get_folder_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_folder_id.return_value = "folder_id_123"

        response = {"value": [{"name": "file", "file": "1234"}]}
        site_id = "site_id_123"
        folder_id = "folder_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/items/{folder_id}/children",
            json=response,
            status_code=200,
        )
        result = connect.get_folders("/sites/123456/test", None)
        assert "/sites/123456/test/file" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_folder_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_files_library(
        self, mock_session, mock_get_site_id, mock_get_folder_id, mock_get_drive_id
    ):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_folder_id.return_value = "folder_id_123"
        mock_get_drive_id.return_value = "drive_id_123"

        response = {"value": [{"name": "file", "file": "1234"}]}
        site_id = "site_id_123"
        folder_id = "folder_id_123"
        drive_id = "drive_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{folder_id}/children",
            json=response,
            status_code=200,
        )
        result = connect.get_folders("/sites/123456/test", "library_name")
        assert "/sites/123456/test/file" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_files_root(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        response = {"value": [{"name": "file", "file": "1234"}]}
        site_id = "site_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root/children",
            json=response,
            status_code=200,
        )
        result = connect.get_files_root(None)
        assert "file" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_files_root_library(self, mock_session, mock_get_site_id, mock_get_drive_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_drive_id.return_value = "drive_id_123"

        response = {"value": [{"name": "file", "file": "1234"}]}
        site_id = "site_id_123"
        drive_id = "drive_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children",
            json=response,
            status_code=200,
        )
        result = connect.get_files_root("library_name")
        assert "file" in result[0]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_properties(self, mock_session, mock_get_site_id):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"

        response = {
            "value": [
                {
                    "file": "file_id",
                    "name": "test.txt",
                }
            ]
        }
        site_id = "site_id_123"
        relative_url = "123456"
        file_name = "test.txt"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{file_name}?$expand=listItem",
            json=response,
            status_code=200,
        )

        result = connect.get_file_properties("123456", "test.txt", None)
        assert "file_id" in result["value"][0]["file"]
        assert self.mock.call_count == 1

    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_drive_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.get_site_id")
    @patch("yaku.sharepoint_fetcher.cloud.connect.Connect.sharepoint_cloud_instance_connect")
    def test_get_file_properties_library(
        self, mock_session, mock_get_site_id, mock_get_drive_id
    ):
        connect = Connect(
            "https://some.sharepoint.server/sites/123456/",
            "tenant-id",
            "client-id",
            "client-secret",
        )

        mock_session.return_value = {"Authorization": "Bearer your_token"}
        mock_get_site_id.return_value = "site_id_123"
        mock_get_drive_id.return_value = "drive_id_123"

        response = {
            "value": [
                {
                    "file": "file_id",
                    "name": "test.txt",
                }
            ]
        }
        site_id = "site_id_123"
        relative_url = "123456"
        file_name = "test.txt"
        drive_id = "drive_id_123"

        self.mock.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{relative_url}/{file_name}?$expand=listItem",
            json=response,
            status_code=200,
        )

        result = connect.get_file_properties("123456", "test.txt", "library_name")
        assert "file_id" in result["value"][0]["file"]
        assert self.mock.call_count == 1
