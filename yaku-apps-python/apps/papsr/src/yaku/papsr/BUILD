python_sources(
    name="app",
    dependencies=[
        # if you modify this list of extra dependencies, make sure to update
        # the list of builtin libraries in the user-documentation repo under
        # source/autopilots/papsr/reference/builtin-libraries.md
        ":version",
        "3rdparty:reqs#openpyxl",
        "3rdparty:reqs#pandas",
        "3rdparty:reqs#pyhanko",
        "3rdparty:reqs#pypdf",
        "3rdparty:reqs#pyyaml",
        "3rdparty:reqs#requests",
        "3rdparty:reqs#xlrd",
        "3rdparty:reqs#jira",
        "3rdparty:reqs#beautifulsoup4",
        "3rdparty:reqs#pytest",
        "packages/autopilot-utils/src/yaku/autopilot_utils:lib",
    ],
)

resource(
    name="version",
    source="_version.txt",
)
