load("@rules_helm//helm:defs.bzl", "helm_chart", "helm_lint_test")

exports_files(["Chart.lock"])

helm_chart(
    name = "yaku_helm",
    chart = "Chart.yaml",
    registry_url = "oci://ghcr.io/b-s-f/charts/",
    values = "values.yaml",
    images = [
        "//core-image:push-image",
    ],
    deps = [
        "@helm_dep_argo_workflows",
        "@helm_dep_minio",
    ],
)

helm_lint_test(
    name = "yaku_helm_lint",
    chart = ":yaku_helm",
)
