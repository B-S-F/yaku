import json
import urllib.request
from pathlib import Path

import mock
import pytest
from yaku.pex_tool.utils import wheels


def test_parse_distinfo_metadata(tmp_path: Path):
    metadata_file = tmp_path / "METADATA"
    metadata_file.write_text("Some-Key: Some-Value\nOther-Key: Other-Value\n")

    metadata = wheels._parse_distinfo_metadata(metadata_file)

    assert metadata == {"Some-Key": "Some-Value", "Other-Key": "Other-Value"}


def test_parse_invalid_distinfo_metadata(tmp_path: Path):
    metadata_file = tmp_path / "METADATA"
    metadata_file.write_text("Some-Invalid-Line\nValid: Value")

    metadata = wheels._parse_distinfo_metadata(metadata_file)

    assert metadata == {}


def test_get_license_texts_from_distinfo(tmp_path: Path):
    LICENSE = "My license text"
    (tmp_path / "LICENSE.txt").write_text(LICENSE)
    (tmp_path / "LICENSE.md").write_text(LICENSE)
    (tmp_path / "LICENCE_Apache.md").write_text(LICENSE)
    (tmp_path / "OTHER_LICENSE.txt").write_text(LICENSE)

    texts1 = wheels._get_license_texts_from_distinfo(None, tmp_path)
    texts2 = wheels._get_license_texts_from_distinfo("OTHER_LICENSE.txt", tmp_path)

    assert texts1 == {
        "LICENSE.txt": LICENSE,
        "LICENSE.md": LICENSE,
        "LICENCE_Apache.md": LICENSE,
    }
    assert texts2 == {
        "LICENSE.txt": LICENSE,
        "OTHER_LICENSE.txt": LICENSE,
        "LICENSE.md": LICENSE,
        "LICENCE_Apache.md": LICENSE,
    }


def test_get_distinfo(tmp_path: Path):
    metadata_file = tmp_path / "METADATA"
    metadata_file.write_text("Name: foo\nVersion: 1.0\n")
    LICENSE = "My license text"
    (tmp_path / "LICENSE.txt").write_text(LICENSE)

    distinfo = wheels.get_distinfo(tmp_path, with_license_texts=False)
    assert distinfo["Name"] == "foo"
    assert distinfo["Version"] == "1.0"
    assert wheels.LICENSE_TEXTS_KEY not in distinfo

    full_distinfo = wheels.get_distinfo(tmp_path, with_license_texts=True)
    assert full_distinfo["Name"] == "foo"
    assert full_distinfo["Version"] == "1.0"
    assert full_distinfo[wheels.LICENSE_TEXTS_KEY] == {"LICENSE.txt": LICENSE}


def test_get_distinfo_with_license_in_subfolder(tmp_path: Path):
    metadata_file = tmp_path / "METADATA"
    metadata_file.write_text("Name: foo\nVersion: 1.0\nLicense-File: licenses/LICENSE.txt")
    LICENSE = "My license text"
    (tmp_path / "licenses").mkdir()
    (tmp_path / "licenses" / "LICENSE.txt").write_text(LICENSE)

    distinfo = wheels.get_distinfo(tmp_path, with_license_texts=False)
    assert distinfo["Name"] == "foo"
    assert distinfo["Version"] == "1.0"
    assert wheels.LICENSE_TEXTS_KEY not in distinfo

    full_distinfo = wheels.get_distinfo(tmp_path, with_license_texts=True)
    assert full_distinfo["Name"] == "foo"
    assert full_distinfo["Version"] == "1.0"
    assert full_distinfo[wheels.LICENSE_TEXTS_KEY] == {"licenses/LICENSE.txt": LICENSE}


def test_get_pex_info(tmp_path: Path):
    info_data = {"foo": "bar"}
    pex_info_file = tmp_path / "PEX-INFO"
    pex_info_file.write_text(json.dumps(info_data))

    info = wheels.get_pex_info(tmp_path)

    assert info == info_data


def test_get_wheels_info_from_pex_file(tmp_path: Path, mocker: mock):
    info_data = {"distributions": {"pkg-0.1-some_extra_info": {}, "other-0.2-foo": {}}}
    pex_info_file = tmp_path / "PEX-INFO"
    pex_info_file.write_text(json.dumps(info_data))

    mocker.patch("yaku.pex_tool.utils.wheels.get_distinfo")

    wheels.get_wheels_info_from_pex_file(tmp_path, False)

    assert wheels.get_distinfo.call_count == 2
    wheels.get_distinfo.assert_has_calls(
        [
            mock.call(
                tmp_path / ".deps" / "pkg-0.1-some_extra_info" / "pkg-0.1.dist-info", False
            ),
            mock.call().__setitem__(wheels.DISTRIBUTION_KEY, "pkg-0.1-some_extra_info"),
            mock.call(tmp_path / ".deps" / "other-0.2-foo" / "other-0.2.dist-info", False),
            mock.call().__setitem__(wheels.DISTRIBUTION_KEY, "other-0.2-foo"),
        ]
    )


def test_get_distinfo_locations(tmp_path: Path):
    (tmp_path / "x.dist-info").mkdir()

    locations = wheels._get_distinfo_locations(tmp_path, tmp_path)

    assert locations == [Path("x.dist-info")]


def test_get_distinfo_locations_in_nested_folders(tmp_path: Path):
    vendor_path = tmp_path / "vendored"
    vendor_path.mkdir()
    (vendor_path / "pkgA.dist-info").mkdir()
    (vendor_path / "pkgB.dist-info").mkdir()

    locations = wheels._get_distinfo_locations(tmp_path)

    assert set(locations) == {Path("vendored/pkgA.dist-info"), Path("vendored/pkgB.dist-info")}

    locations = wheels._get_distinfo_locations(vendor_path, tmp_path)

    assert set(locations) == {Path("vendored/pkgA.dist-info"), Path("vendored/pkgB.dist-info")}


def test_get_nested_distinfo(tmp_path: Path):
    root_path = tmp_path / "xyz.wheel"
    root_path.mkdir()
    vendor_path = root_path / "vendored"
    vendor_path.mkdir()
    pkgA_path = vendor_path / "pkgA.dist-info"
    pkgA_path.mkdir()
    (pkgA_path / "METADATA").touch()

    distinfos = wheels.get_nested_distinfo(root_path, with_license_texts=False)

    assert distinfos[0] == {
        wheels.DISTRIBUTION_KEY: "xyz.wheel",
        wheels.DISTINFO_PATH_KEY: Path("vendored/pkgA.dist-info"),
    }


def test_get_pex_wheel_from_cache(mocker: mock):
    mocker.patch("pathlib.Path.mkdir")

    mocker.patch(
        "yaku.pex_tool.utils.wheels._lookup_pex_wheel_url_on_pypi",
        return_value=("url://not.used.as.file.exists.in.cache.already", "wheel_name"),
    )

    mocker.patch("pathlib.Path.exists", return_value=True)

    cached_wheel = wheels.get_pex_wheel("1.2.3")
    assert cached_wheel == wheels.WHEEL_CACHE_PATH / "wheel_name"


def test_get_pex_wheel_from_pypi(mocker: mock):
    URL = "https://pypi.org/some/download/url/for/pex.whl"
    NAME = "wheel_name"
    mocker.patch("pathlib.Path.mkdir")

    mocker.patch(
        "yaku.pex_tool.utils.wheels._lookup_pex_wheel_url_on_pypi",
        return_value=(URL, NAME),
    )

    mocker.patch("pathlib.Path.exists", return_value=False)
    mocker.patch("urllib.request.urlretrieve")

    cached_wheel = wheels.get_pex_wheel("1.2.3")
    assert cached_wheel == wheels.WHEEL_CACHE_PATH / NAME
    urllib.request.urlretrieve.assert_has_calls(
        [mock.call(URL, str(wheels.WHEEL_CACHE_PATH / NAME))]
    )


def test_as_json():
    assert wheels.as_json({"a": 1}) == json.dumps({"a": 1})
    # make sure that JSON cannot serialize an `Exception` class
    with pytest.raises(TypeError):
        json.dumps({"a": Exception})
    # now use an `Exception` class as test object
    assert wheels.as_json({"a": Exception}) == json.dumps({"a": "<class 'Exception'>"})
