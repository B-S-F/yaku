load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@aspect_rules_js//npm:repositories.bzl", "npm_translate_lock")

# This macro expands to a link_npm_package for each third-party package in package.json
npm_link_all_packages(name = "node_modules")


ts_config(
    name = "tsconfig",
    src = "tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["//:node_modules/@tsconfig/node16-strictest"],
)


package(default_visibility = ["//visibility:public"])