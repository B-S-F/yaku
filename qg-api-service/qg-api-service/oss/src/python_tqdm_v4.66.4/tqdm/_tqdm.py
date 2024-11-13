from warnings import warn

from .std import *  # NOQA
from .std import (
    TqdmDeprecationWarning,
    __all__,  # NOQA
)

warn(
    "This function will be removed in tqdm==5.0.0\n"
    "Please use `tqdm.std.*` instead of `tqdm._tqdm.*`",
    TqdmDeprecationWarning,
    stacklevel=2,
)
