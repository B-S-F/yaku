workspace(name = "yaku")

###
# Helm
###
load("@rules_helm//helm:defs.bzl", "helm_import_repository")

# Import the Argo Workflows chart
helm_import_repository(
    name = "helm_dep_argo_workflows",
    repository = "https://github.com/argoproj/argo-helm/releases/download/argo-workflows-0.41.4",
    url = "https://github.com/argoproj/argo-helm/releases/download/argo-workflows-0.41.4/argo-workflows-0.41.4.tgz",
    version = "0.41.4",
    sha256 = "334672c4a778cdf510e76906e22734440100120498f4e5c3c432106f303afe2e",
    chart_name = "argo-workflows",
)

# Import the MinIO chart
helm_import_repository(
    name = "helm_dep_minio",
    repository = "https://charts.min.io/helm-releases",
    url = "https://charts.min.io/helm-releases/minio-5.2.0.tgz",
    version = "5.2.0",
    sha256 = "8ef4212d7d51be6c8192b3e91138a9ca918ca56142c42500028cfd3b80e0b2dd",
    chart_name = "minio",
)