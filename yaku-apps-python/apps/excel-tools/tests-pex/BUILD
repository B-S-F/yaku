APP = "excel-tools"
A_PP = APP.replace("-", "_")

python_tests(
    dependencies=[
        f"apps/{APP}/src/yaku/{A_PP}:app",
    ],
    runtime_package_dependencies=[
        f"apps/{APP}:{APP}",
    ],
    skip_bandit=True,
    skip_mypy=True,
)
