load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_swc//swc:defs.bzl", "swc")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@bazel_skylib//lib:partial.bzl", "partial")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")

# For more information about using swc to transpile please see the ts_project_transpiler example
ts_project(
    name = "swc",
    srcs = glob([
        "src/**/*.ts",
    ]),
    declaration = True,
    incremental = True,
    source_map = True,
    transpiler = partial.make(
        swc,
        swcrc = ".swcrc",
    ),
    deps = [
        ":node_modules",
#        ":node_modules/pino",
#        ":node_modules/@nestjs/common",
#        ":node_modules/@nestjs/core",
#        ":node_modules/@types/node",
    ],
)

js_binary(
    name = "bin",
    data = [
        ":swc",

        # Added by swc during transpilation and used at runtime
        #":node_modules/regenerator-runtime",
        ":node_modules",
  #      ":node_modules/pino",
       # ":node_modules/@types/node",
    ],
    entry_point = "src/main.js",
)
