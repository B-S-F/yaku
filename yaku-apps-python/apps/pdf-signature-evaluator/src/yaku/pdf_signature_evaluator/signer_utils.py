import re
from pathlib import Path
from typing import Dict, List

from asn1crypto import cms
from loguru import logger
from yaku.autopilot_utils.errors import AutopilotError

SignersDict = Dict[str, List[str]]


def get_signers(pdf: Path, certificate_names: set[str]) -> List[str]:
    try:
        data = pdf.read_bytes()
    except Exception:
        raise AutopilotError(f"Could not read file {pdf.stem}")
    signers = []
    for s in re.finditer(b"/ByteRange", data):
        try:
            start = data.find(b"[", s.start()) + 1
            end = data.find(b"]", s.start())
            byterange = [int(i, 10) for i in data[start:end].split()]
            contents = data[byterange[0] + byterange[1] + 1 : byterange[2] - 1]
            bcontents = bytes.fromhex(contents.decode("utf8"))
            signed_data = cms.ContentInfo.load(bcontents)["content"]
            for cert in signed_data["certificates"]:
                common_name = cert.native["tbs_certificate"]["subject"]["common_name"]
                if not any(name in certificate_names for name in common_name):
                    signers.append(common_name)
        except Exception:
            logger.info("Could not get signers from {}", pdf.stem)
            return []
    return signers


def get_signers_dictionary(pdf_list: List[Path], certificate_names: set[str]) -> SignersDict:
    pdf_signers: SignersDict = {}
    for pdf in pdf_list:
        signers_in_pdf = get_signers(pdf, certificate_names)
        if signers_in_pdf:
            pdf_name = pdf.stem + pdf.suffix
            pdf_signers[pdf_name] = signers_in_pdf
    return pdf_signers


def parse_real_signers(real_signers_dict: dict[str, list]) -> dict[str, list]:
    """
    Parse the real signers dictionary and removes everything that is not recognized as a signer.

    Therefore, a regular expression does check for anything that matches the pattern anything.anything.
    :param dict real_signers_dict: A dictionary that was returned by the method that extracts the real signers
    from a pdf file.
    :return: A dictionary that only include signers without any noise.
    """
    result: dict[str, list] = {}
    regular_expression = "\\S+\\.\\S+"

    for file_name, signatures in real_signers_dict.items():
        for item in signatures:
            out = [string for string in item if re.match(regular_expression, string)]
            if len(out) > 0:
                result.setdefault(file_name, []).extend(out)
    return result
