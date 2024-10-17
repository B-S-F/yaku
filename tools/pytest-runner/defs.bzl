load("@aspect_rules_py//py:defs.bzl", "py_test")

def py_pytest_test(name, srcs, deps, data = None):
    py_test(
        name = name,
        srcs = srcs + ["//tools/pytest-runner:run_pytest.py"],
        # We have to tell pytest to only look into the `yaku-apps-python` subdirectory
        # of the sandbox folder, as it also contains the installed Python
        # packages which might contain also some tests. To prevent them
        # from being picked up by pytest, we restrict pytest to our main
        # folder, currently `yaku-apps-python`.
        args = ["yaku-apps-python"],
        main = "run_pytest.py",
        data = data,
        deps = deps + [
            "@pip//pytest",
            "@pip//pytest_cov",
        ],
    )
