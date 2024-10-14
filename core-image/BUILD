load("@aspect_bazel_lib//lib:testing.bzl", "assert_archive_contains")
load("@aspect_bazel_lib//lib:transitions.bzl", "platform_transition_filegroup")
load("@container_structure_test//:defs.bzl", "container_structure_test")
load("@rules_oci//oci:defs.bzl", "oci_image", "oci_tarball", "oci_push")
load("@aspect_bazel_lib//lib:expand_template.bzl", "expand_template")
load("@rules_pkg//:pkg.bzl", "pkg_tar")

# Put app go_binary into a tar layer.
pkg_tar(
    name = "app_layer",
    srcs = ["//onyx/cmd/cli:onyx"],
    # If the binary depends on RUNFILES, uncomment the attribute below.
    #include_runfiles = True
)

# Prove that the application is at the path we expect in that tar.
assert_archive_contains(
    name = "test_app_layer",
    archive = "app_layer.tar",
    expected = ["onyx"],
)

oci_image(
    name = "image",
    base = "@distroless_base",
    entrypoint = ["/onyx"],
    tars = [":app_layer"],
)

# This is the target that should be released to the target platform
platform_transition_filegroup(
    name = "transitioned_image",
    srcs = [":image"],
    target_platform = select({
        "@platforms//cpu:arm64": "@rules_go//go/toolchain:linux_arm64",
        "@platforms//cpu:x86_64": "@rules_go//go/toolchain:linux_amd64",
    }),
)

# Use the value of --embed_label under --stamp, otherwise use a deterministic constant
# value to ensure cache hits for actions that depend on this.
expand_template(
    name = "stamped",
    out = "_stamped.tags.txt",
    stamp_substitutions = {"0.0.0": "{{BUILD_EMBED_LABEL}}"},
    stamp = 1,
    template = [
        "0.0.0",
        "nightly",
    ],
)

oci_push(
    name = "push-image",
    image = ":transitioned_image",
    repository = "ghcr.io/b-s-f/yaku/core-image-test",
    remote_tags = ":stamped",
)

# $ bazel build //core-image:tarball
# $ docker load --input $(bazel cquery --output=files //core-image:tarball)
# $ docker run --rm gcr.io/example:foo
#   string(
# -       "Hello World",
# +       "Hello Go",
#   )

#oci_tarball(
#    name = "tarball",
#    # Use the image built for the exec platform rather than the target platform
#    image = ":transitioned_image",
#    repo_tags = ["bar/example:foo"],
#)

#container_structure_test(
#    name = "test",
#    configs = ["test.yaml"],
#    # Use the image built for the exec platform rather than the target platform
#    image = ":image",
#    tags = ["requires-docker"],
#)