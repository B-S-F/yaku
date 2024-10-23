load("@aspect_rules_js//js:defs.bzl", "js_binary", "js_library")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_swc//swc:defs.bzl", "swc")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@bazel_skylib//lib:partial.bzl", "partial")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")

# # For more information about using swc to transpile please see the ts_project_transpiler example
# ts_project(
#     name = "swc",
#     srcs = glob([
#         "src/**/*.ts",
#     ]),
#     declaration = True,
#     incremental = True,
#     source_map = True,
#     transpiler = partial.make(
#         swc,
#         swcrc = ".swcrc",
#     ),
#     deps = [
#         ":node_modules",
#         "//:node_modules",
# #        ":node_modules/pino",
# #        ":node_modules/@nestjs/common",
# #        ":node_modules/@nestjs/core",
# #        ":node_modules/@types/node",
#     ],
# )

# # make this library available via node_modules
# npm_package(
#     name = "api-commons-lib",
#     srcs = [
#         "package.json",
#         "src/index.js",
#         "src/input-validator.js",
#         "src/oss-compliance.controller.js",
#         "src/oss-compliance.service.js",
#         "src/public-decorator.js",
#         "src/query-param-handling-controller.js",
#         "src/query-param-handling-service.js",
#         "src/stream-utils.js",
#         "src/test-services.js",
#         "src/url-handler.js"
#     ],
#     # This is a perf improvement; the default will be flipped to False in rules_js 2.0
#     include_runfiles = False,
#     visibility = ["//visibility:public"],
# )

ts_project(
    name = "tsc",
    srcs = glob([
        "src/**/*.ts",
    ]),
    declaration = True,
    incremental = True,
    resolve_json_module = True,
    source_map = True,
    transpiler = partial.make(
        swc,
        swcrc = ".swcrc",
    ),
    tsconfig = "//:tsconfig",
    validate = False,
    deps = [
        ":node_modules",
    ],
)

npm_package(
    name = "api-commons-lib",
    srcs = [
        "package.json",
        "src/index.js",
        "src/input-validator.js",
        "src/oss-compliance.controller.js",
        "src/oss-compliance.service.js",
        "src/public-decorator.js",
        "src/query-param-handling-controller.js",
        "src/query-param-handling-service.js",
        "src/stream-utils.js",
        "src/test-services.js",
        "src/url-handler.js",
    ],
    # This is a perf improvement; the default will be flipped to False in rules_js 2.0
    include_runfiles = False,
    visibility = ["//visibility:public"],
)

npm_package(
    name = "pkg",
    srcs = [
        "package.json",
        "src/index.js",
        "src/input-validator.js",
        "src/oss-compliance.controller.js",
        "src/oss-compliance.service.js",
        "src/public-decorator.js",
        "src/query-param-handling-controller.js",
        "src/query-param-handling-service.js",
        "src/stream-utils.js",
        "src/test-services.js",
        "src/url-handler.js",
    ],
    # This is a perf improvement; the default will be flipped to False in rules_js 2.0
    include_runfiles = False,
    visibility = ["//visibility:public"],
)
