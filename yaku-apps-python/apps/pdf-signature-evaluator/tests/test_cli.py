from pathlib import Path

import mock
from click.testing import CliRunner
from yaku.autopilot_utils.results import (
    RESULTS,
    Result,
    assert_result_status,
    protect_results,
)
from yaku.pdf_signature_evaluator.cli import main


@protect_results
def test_trigger_evaluator_works(mocker: mock, tmp_path: Path):
    r = Result(criterion="", fulfilled=True, justification="")
    RESULTS.append(r)

    mocked_1 = mocker.patch("yaku.pdf_signature_evaluator.cli.Path.is_file")
    mocked_1.return_value = True
    mocked_3 = mocker.patch("yaku.pdf_signature_evaluator.cli.digital_signature_verification")
    mocked_3.return_value = True

    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test_configuration").touch()
        (Path(td) / "test_certificates").mkdir()
        (Path(td) / "test_pdf_location").touch()
        result = runner.invoke(
            main,
            [
                "--configuration",
                "test_configuration",
                "--certificates",
                "test_certificates",
                "--pdf-location",
                "test_pdf_location",
                "--strict",
                "--validate-signers",
            ],
        )

    assert_result_status(result.output, "GREEN", reason="All criteria are fulfilled.")


# move it to cli runner, rever test on digital verification
def test_trigger_evaluator_no_pdf_location(mocker: mock, tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test_configuration").touch()
        (Path(td) / "test_certificates").mkdir()
        result = runner.invoke(
            main,
            [
                "--configuration",
                "test_configuration",
                "--certificates",
                "test_certificates",
                "--strict",
                "--validate-signers",
            ],
        )

    assert_result_status(result.output, "FAILED", reason="Missing parameter: pdf_location")


@protect_results
def test_trigger_evaluator_validate_signers_with_no_configuration(
    mocker: mock, tmp_path: Path
):
    r = Result(criterion="", fulfilled=True, justification="")
    RESULTS.append(r)

    mocked_3 = mocker.patch("yaku.pdf_signature_evaluator.cli.digital_signature_verification")
    mocked_3.return_value = True

    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test_certificates").mkdir()
        (Path(td) / "test_pdf_location").touch()
        result = runner.invoke(
            main,
            [
                "--certificates",
                "test_certificates",
                "--pdf-location",
                "test_pdf_location",
                "--strict",
                "--validate-signers",
            ],
        )

    assert_result_status(result.output, "GREEN", reason="All criteria are fulfilled.")
