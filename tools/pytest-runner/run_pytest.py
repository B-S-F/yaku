import os
import sys

import pytest

if __name__ == "__main__":
    sys.exit(pytest.main(sys.argv[1:]))
    # sys.exit(
    #     pytest.main(
    #         sys.argv[1:]
    #         + [
    #             "--cov=yaku",
    #             "--cov-report=lcov:" + os.getenv("COVERAGE_OUTPUT_FILE", ""),
    #             "--cov-report=term",
    #             "--cov-branch",
    #         ]
    #     )
    # )
