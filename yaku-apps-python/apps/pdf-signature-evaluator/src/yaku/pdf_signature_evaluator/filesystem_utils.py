from pathlib import Path
from typing import List

from loguru import logger
from yaku.autopilot_utils.errors import AutopilotError


def get_file_list(root: Path, extension: str) -> List[Path]:
    file_list: List[Path] = []
    logger.debug("Looking for {} files in {}...", extension, root)
    try:
        if root.is_file() and root.suffix == extension:
            file_list = [root]
        elif root.is_dir():
            for path_obj in root.rglob("*"):
                if path_obj.is_file() and path_obj.suffix == extension:
                    logger.debug("Found {}", path_obj)
                    file_list.append(path_obj)
    except Exception as e:
        raise AutopilotError(f"Could not retrieve files from {root}: {e}")
    return file_list


def get_certificate_paths(path: Path) -> List[Path]:
    pem_files = get_file_list(path, ".pem")
    crt_files = get_file_list(path, ".crt")
    return pem_files + crt_files


def get_pdf_paths(path: Path) -> List[Path]:
    pdf_files = get_file_list(path, ".pdf")
    return pdf_files
