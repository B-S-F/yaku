# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import os
import sys

sys.path.append(os.path.abspath("./_ext"))
sys.path.append("../../yaku-apps-python/packages/autopilot-utils/src/")
import yaku.autopilot_utils

yaku.autopilot_utils

# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Yaku"
copyright = "2024 grow platform GmbH"
author = "Yaku Developers"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "myst_parser",
    "sphinx_design",
    "sphinxcontrib.mermaid",
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx.ext.todo",
    "sphinx_autodoc_typehints",  # must come after sphinx.ext.napoleon!
    "sphinx_copybutton",
    "sphinxcontrib.openapi",
    "ytvideo",
]

default_role = "code"

myst_substitutions = {
    "PRODUCTNAME": f"{project}",
    "PNAME": f"{project}",
    # "PNAME": "{abbr}`"
    # + "".join(map(lambda x: x[0], project.split()))
    # + f" ({project})`",
}

html_css_files = ["custom.css", "variables.css"]
html_js_files = ["data-protection-layer.js"]
templates_path = ["_templates"]
exclude_patterns = []

todo_include_todos = True
autosectionlabel_prefix_document = True

myst_heading_anchors = 4
myst_enable_extensions = [
    "smartquotes",
    "replacements",
    "strikethrough",
    # "dollarmath",
    # "amsmath",
    "linkify",
    "substitution",
    "colon_fence",
    "deflist",
    "tasklist",
    # "attrs_inline",
    "html_image",
    "html_admonition",
]

mermaid_version = "10.8.0"

# autodoc settings
autoclass_content = "both"
autodoc_default_flags = []
autodoc_mock_imports = ["dateutil", "loguru", "pytz", "pydantic"]
autosummary_generate = True

# Napoleon settings
napoleon_google_docstring = False
napoleon_numpy_docstring = True
napoleon_use_rtype = False

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinx_book_theme"
html_static_path = ["_static"]

html_sidebars = {"**": ["navbar-logo.html", "search-field.html", "sbt-sidebar-nav.html"]}

html_title = f"{project} – Documentation"
# html_favicon = "_static/favicon.ico"
html_theme_options = {
    "repository_url": "https://github.com/B-S-F/yaku/",  # FIXME
    "repository_branch": "main",
    "path_to_docs": "user-documentation/source/",
    "use_repository_button": True,
    "use_edit_page_button": True,
    "use_download_button": False,
    "show_toc_level": 3,
    # "pygments_style": "stata",
    "pygments_light_style": "vs",
    "pygments_dark_style": "stata-dark",
}
