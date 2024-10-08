from pants.backend.python.util_rules.package_dists import SetupKwargs, SetupKwargsRequest
from pants.backend.python.target_types import PythonDistribution
from pants.engine.fs import DigestContents, GlobMatchErrorBehavior, PathGlobs
from pants.engine.rules import Get, collect_rules, rule
from pants.engine.target import Target
from pants.engine.unions import UnionRule

class CustomSetupKwargsRequest(SetupKwargsRequest):
    @classmethod
    def is_applicable(cls, target: Target) -> bool:
        return isinstance(target, ExternallyVersionedPythonDistribution)

@rule
async def setup_kwargs_plugin(request: CustomSetupKwargsRequest) -> SetupKwargs:
    args = request.explicit_kwargs.copy()

    if "version_file" not in args:
        raise TypeError(
            "You must provide a `version_file` kwarg in the `provides` "
            f"field for {request.target.address}."
        )

    filename = args.pop("version_file")
    digest_contents = await Get(
        DigestContents,
        PathGlobs(
            [request.target.residence_dir + "/" + filename],
            description_of_origin="`python_utils()` plugin",
            glob_match_error_behavior=GlobMatchErrorBehavior.error,
        ),
    )
    args["version"] = digest_contents[0].content.decode()

    return SetupKwargs(
        args,
        address=request.target.address
    )

def rules():
    return [
        *collect_rules(),
        UnionRule(SetupKwargsRequest, CustomSetupKwargsRequest),
    ]

class ExternallyVersionedPythonDistribution(Target):
   alias = "externally_versioned_python_distribution"
   core_fields = PythonDistribution.core_fields


def target_types():
    return [ExternallyVersionedPythonDistribution]
