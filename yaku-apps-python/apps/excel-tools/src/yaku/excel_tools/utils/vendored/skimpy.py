#
# The code in this module was copied from (and slightly adapted)
# https://github.com/aeturrell/skimpy/blob/68a86f371eb23e8b1c523744bbba63661db01807/src/skimpy/__init__.py
# (which is licensed under MIT license, see https://raw.githubusercontent.com/aeturrell/skimpy/main/LICENSE.md)
#
# The original license text was:
#
# ---
# title: MIT License
# ---
#
# Copyright © 2021 Arthur Turrell
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# \"Software\"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# **The software is provided \"as is\", without warranty of any kind,
# express or implied, including but not limited to the warranties of
# merchantability, fitness for a particular purpose and noninfringement.
# In no event shall the authors or copyright holders be liable for any
# claim, damages or other liability, whether in an action of contract,
# tort or otherwise, arising from, out of or in connection with the
# software or the use or other dealings in the software.**
#

import re
from typing import Any, Dict, List, Optional
from unicodedata import normalize

import numpy as np
import pandas as pd

NULL_VALUES = {np.nan, "", None}

CASE_STYLES = {
    "snake",
    "kebab",
    "camel",
    "pascal",
    "const",
    "sentence",
    "title",
    "lower",
    "upper",
}


def clean_columns(
    df: pd.DataFrame,
    case: str = "snake",
    replace: Optional[Dict[str, str]] = None,
    remove_accents: bool = True,
) -> pd.DataFrame:
    """Clean messy column names of a pandas dataframe.

    Args:
        df (pd.DataFrame): Dataframe from which column names are to be cleaned.
        case (str, optional): The desired case style of the column name. Defaults to "snake".

                - 'snake': 'column_name'
                - 'kebab': 'column-name'
                - 'camel': 'columnName'
                - 'pascal': 'ColumnName'
                - 'const': 'COLUMN_NAME'
                - 'sentence': 'Column name'
                - 'title': 'Column Name'
                - 'lower': 'column name'
                - 'upper': 'COLUMN NAME'

        replace (Optional[Dict[str, str]], optional): Values to replace in the column names. Defaults to None.

                - {'old_value': 'new_value'}

        remove_accents (bool, optional): If True, strip accents from the column names. Defaults to True.

    Raises:
        ValueError: If case is not valid.

    Returns:
        pd.DataFrame: Dataframe with cleaned column names.

    Examples
    --------
    Clean column names by converting the names to camel case style, removing accents,
    and correcting a mispelling.

    >>> df = pd.DataFrame(
                          {
                           'FirstNom': ['Philip', 'Turanga'],
                           'lastName': ['Fry', 'Leela'],
                           'Téléphone': ['555-234-5678', '(604) 111-2335']
                          })

    >>> clean_columns(df, case='camel', replace={'Nom': 'Name'})
      firstName lastName       telephone
    0    Philip      Fry    555-234-5678
    1   Turanga    Leela  (604) 111-2335
    """
    if case not in CASE_STYLES:
        raise ValueError(
            f"case {case} is invalid, options are: {', '.join(c for c in CASE_STYLES)}"
        )

    if replace:
        df = df.rename(columns=lambda col: _replace_values(col, replace))

    if remove_accents:
        df = df.rename(columns=_remove_accents)

    df = df.rename(columns=lambda col: _convert_case(col, case))
    df.columns = _rename_duplicates(df.columns, case)
    return df


def _convert_case(name: Any, case: str) -> Any:
    """Convert case style of a column name.

    Args:
        name (Any): Column name.
        case (str): Preferred case type, eg snake or camel.

    Returns:
        Any: name with case converted.
    """
    if name in NULL_VALUES:
        name = "header"

    if case in {"snake", "kebab", "camel", "pascal", "const"}:
        words = _split_strip_string(str(name))
    else:
        words = _split_string(str(name))

    if case == "snake":
        name = "_".join(words).lower()
    elif case == "kebab":
        name = "-".join(words).lower()
    elif case == "camel":
        name = words[0].lower() + "".join(w.capitalize() for w in words[1:])
    elif case == "pascal":
        name = "".join(w.capitalize() for w in words)
    elif case == "const":
        name = "_".join(words).upper()
    elif case == "sentence":
        name = " ".join(words).capitalize()
    elif case == "title":
        name = " ".join(w.capitalize() for w in words)
    elif case == "lower":
        name = " ".join(words).lower()
    elif case == "upper":
        name = " ".join(words).upper()

    return name


def _split_strip_string(string: str) -> List[str]:
    """Split the string into separate words and strip punctuation."""
    string = re.sub(r"[!()*+\,\-./:;<=>?[\]^_{|}~]", " ", string)
    string = re.sub(r"[\'\"\`]", "", string)

    return re.sub(
        r"([A-Z][a-z]+)", r" \1", re.sub(r"([A-Z]+|[0-9]+|\W+)", r" \1", string)
    ).split()


def _split_string(string: str) -> List[str]:
    """Split the string into separate words."""
    string = re.sub(r"[\-_]", " ", string)

    return re.sub(r"([A-Z][a-z]+)", r" \1", re.sub(r"([A-Z]+)", r"\1", string)).split()


def _replace_values(name: Any, mapping: Dict[str, str]) -> Any:
    """Replace string values in the column name.

    Parameters
    ----------
    name
        Column name.
    mapping
        Maps old values in the column name to the new values.
    """
    if name in NULL_VALUES:
        return name

    name = str(name)
    for old_value, new_value in mapping.items():
        # If the old value or the new value is not alphanumeric, add underscores to the
        # beginning and end so the new value will be parsed correctly for _convert_case()
        new_val = (
            rf"{new_value}"
            if old_value.isalnum() and new_value.isalnum()
            else rf"_{new_value}_"
        )
        name = re.sub(rf"{old_value}", new_val, name, flags=re.IGNORECASE)

    return name


def _remove_accents(name: Any) -> Any:
    """Return the normal form for a Unicode string name using canonical decomposition."""
    if not isinstance(name, str):
        return name

    return normalize("NFD", name).encode("ascii", "ignore").decode("ascii")


def _rename_duplicates(names: pd.Index | list[str], case: str) -> Any:
    """Rename duplicated column names to append a number at the end."""
    if case in {"snake", "const"}:
        sep = "_"
    elif case in {"camel", "pascal"}:
        sep = ""
    elif case == "kebab":
        sep = "-"
    else:
        sep = " "

    names = list(names)
    counts: Dict[str, int] = {}

    for i, col in enumerate(names):
        cur_count = counts.get(col, 0)
        if cur_count > 0:
            names[i] = f"{col}{sep}{cur_count}"
        counts[col] = cur_count + 1

    return names
