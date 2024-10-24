python_tests(
    dependencies=[
        "3rdparty:reqs#pytest-mock",
        "3rdparty:reqs#pydantic",
        ":data",
    ],
    skip_bandit=True,
    skip_mypy=True,
)

files(
    name="data",
    sources=["data/**"],
)
