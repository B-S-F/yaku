import itertools
import json
import urllib.request
import zipfile
from pathlib import Path
from typing import Any, Iterable

DISTRIBUTION_KEY = "_Distribution"
DISTINFO_PATH_KEY = "_Distinfo-Path"
LICENSE_TEXTS_KEY = "_License-Texts"

WHEEL_CACHE_PATH = Path("~").expanduser() / ".cache" / "pex_tool_wheels"


class MetadataEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)


def as_json(metadata: Any) -> str:
    return json.dumps(metadata, cls=MetadataEncoder)


def _parse_distinfo_metadata(metadata_file: zipfile.Path | Path) -> dict:
    with metadata_file.open("rb") as fh:
        import email.parser

        metadata = email.parser.BytesHeaderParser().parsebytes(fh.read())
    return dict(metadata.items())


def _guess_license_file_names_from_directory(p: zipfile.Path | Path) -> Iterable[str]:
    license_file_names = set()
    for name, ext in itertools.product(("LICENSE", "LICENCE"), ("", ".md", ".rst", ".txt")):
        if (p / (name + ext)).exists():
            license_file_names.add(name + ext)
    for some_file in p.iterdir():
        name = some_file.name
        if some_file.is_file() and (
            name.upper().startswith("LICENSE") or name.upper().startswith("LICENCE")
        ):
            license_file_names.add(name)
    return license_file_names


def _get_license_texts_from_distinfo(
    license_file_name: str | None,
    distinfo_path: zipfile.Path | Path,
) -> dict[str, str]:
    license_file_names = set()
    if license_file_name:
        license_file_names.add(license_file_name)
    license_file_names.update(_guess_license_file_names_from_directory(distinfo_path))

    license_texts: dict[str, str] = {}
    for license_file_name in license_file_names:
        license_file = distinfo_path / license_file_name
        if license_file.exists():
            license_texts[license_file_name] = license_file.read_text()
    return license_texts


def get_distinfo(distinfo_path: zipfile.Path | Path, with_license_texts: bool) -> dict:
    infos = _parse_distinfo_metadata(distinfo_path / "METADATA")
    if with_license_texts:
        license_file_name = infos.get("License-File")
        infos[LICENSE_TEXTS_KEY] = _get_license_texts_from_distinfo(
            license_file_name, distinfo_path
        )
    return infos


def get_pex_info(zip_root: zipfile.Path | Path) -> Any:
    """Read the JSON data from the `PEX-INFO` file in the root of a pex file."""
    with (zip_root / "PEX-INFO").open("r") as f:
        return json.load(f)


def get_wheels_info_from_pex_file(
    zip_root: zipfile.Path | Path,
    with_license_texts: bool,
) -> list[dict]:
    """
    Extract dist info from wheels bundled inside a pex file.

    It first parses the PEX-INFO file inside the pex file and extracts the
    names of the contained wheels. Then, it goes into the subfolder where the
    wheels are stored and extracts the dist info for each of the wheels.

    Returns a list of metadata dicts.

    See also: get_distinfo()
    """
    pex_info = get_pex_info(zip_root)
    assert "distributions" in pex_info, "PEX-INFO file has no 'distributions' info!"
    wheels_info = []
    key: str
    for key in pex_info["distributions"]:
        name, version, _ = key.split("-", maxsplit=2)
        distinfo_path = zip_root / ".deps" / key / f"{name}-{version}.dist-info"
        infos = get_distinfo(distinfo_path, with_license_texts)
        infos[DISTRIBUTION_KEY] = key
        wheels_info.append(infos)

    return wheels_info


def _get_distinfo_locations(
    vendored_libs_path: zipfile.Path | Path, orig_root: zipfile.Path | Path | None = None
) -> list[str]:
    if orig_root is None:
        orig_root = vendored_libs_path
    result = []
    for entry in vendored_libs_path.iterdir():
        if entry.is_dir():
            if entry.name.endswith(".dist-info"):
                try:
                    result.append(entry.at)  # type: ignore
                except AttributeError:
                    result.append(entry.relative_to(orig_root))  # type: ignore
            else:
                result.extend(_get_distinfo_locations(entry, orig_root=vendored_libs_path))
    return result


def get_nested_distinfo(folder: zipfile.Path | Path, with_license_texts: bool) -> list[dict]:
    distinfos = []
    nested_distinfo_locations = _get_distinfo_locations(folder)
    for distinfo_path in nested_distinfo_locations:
        infos = get_distinfo(
            folder / distinfo_path,
            with_license_texts=with_license_texts,
        )
        infos[DISTRIBUTION_KEY] = folder.name
        infos[DISTINFO_PATH_KEY] = distinfo_path
        distinfos.append(infos)
    return distinfos


def _lookup_pex_wheel_url_on_pypi(pex_version: str) -> tuple[str, str]:
    """Query pypi.org for the given `pex_version` and return the download URL."""
    pex_pypi_url = f"https://pypi.org/pypi/pex/{pex_version}/json"
    with urllib.request.urlopen(pex_pypi_url) as response:  # nosec (is a fixed url)
        pypi_pex_info = json.loads(response.read())
        for artifact in pypi_pex_info["urls"]:
            if artifact["packagetype"] == "bdist_wheel":
                return artifact["url"], artifact["filename"]

    raise RuntimeError(f"Could not find the wheel for pex {pex_version} on {pex_pypi_url}!")


def get_pex_wheel(pex_version: str) -> Path:
    """
    Download the wheel file for pex for the given version.

    Returns the path to the downloaded wheel file.
    """
    WHEEL_CACHE_PATH.mkdir(exist_ok=True)

    wheel_url, wheel_name = _lookup_pex_wheel_url_on_pypi(pex_version)
    cached_wheel = WHEEL_CACHE_PATH / wheel_name

    # check if file exists in cache
    if not cached_wheel.exists():
        # we can ignore bandit warning here as the URL is fixed to point to pypi
        urllib.request.urlretrieve(wheel_url, str(cached_wheel))  # nosec

    # return path to pex wheel file in cache folder
    return cached_wheel
