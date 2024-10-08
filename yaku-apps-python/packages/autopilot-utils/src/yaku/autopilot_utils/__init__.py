from pathlib import Path


def _get_version() -> str:
    return (Path(__file__).parent / "_version.txt").read_text().strip()


__version__ = _get_version()
