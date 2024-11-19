// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

//go:build integration
// +build integration

package exec

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"testing"
	"time"

	"github.com/B-S-F/yaku/onyx/internal/onyx/exec"
	"github.com/B-S-F/yaku/onyx/pkg/helper"
	resultv2 "github.com/B-S-F/yaku/onyx/pkg/v2/result"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

const (
	// ignoring the temp directories, as they are different on each run
	ignoreTempDir = `((\/var\/folders\/.*?\/(exec|apps)\/)|(\/tmp\/.*?\/(exec|apps)\/)|(C:\\\\Temp\\\\.*?\\\\(exec|apps)\\\\))`
	// ignoring the bash line number, as it differs between different Bash versions
	ignoreBashLine = "(/bin/bash: line [0-9]+:)"
	// ignoring the date, as it is different on each run
	ignoreDate = `\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\+\d{2}:\d{2}|Z)|\s\d{2}:\d{2})`
)

func TestExecCommandIntegration(t *testing.T) {
	versions := []string{"v1", "v2"}
	appsPath := "testdata/apps"
	re := regexp.MustCompile(fmt.Sprintf("%s|%s|%s", ignoreTempDir, ignoreBashLine, ignoreDate))
	serveApps(appsPath, "8081", t)

	for _, version := range versions {
		configPath := "testdata/" + version + "/configuration"
		goldenPath := version + "/configuration/qg-result.golden"
		t.Run("test exec integration "+version, func(t *testing.T) {
			tempDir := t.TempDir()
			resultFile := filepath.Join(tempDir, "qg-result.yaml")
			evidenceZipFile := filepath.Join(tempDir, "evidence.zip")
			exec.OverrideDirectoriesForTest(tempDir + "/exec")

			cmd := ExecCommand()
			cmd.SetArgs([]string{
				configPath,
				"--output-dir", tempDir,
				"--check-timeout", "3",
			})
			startTime := time.Now()
			err := cmd.Execute()
			endTime := time.Now()
			diff := endTime.Sub(startTime)
			assert.NoError(t, err)
			assert.Less(t, diff.Seconds(), 10.0)

			assert.FileExists(t, resultFile)
			assert.FileExists(t, evidenceZipFile)
			got, err := os.ReadFile(resultFile)
			replacedGot := re.ReplaceAll(got, []byte{})
			if err != nil {
				t.Fatal(err)
			}
			want := helper.GoldenValue(t, goldenPath, replacedGot, *update)

			assert.Equal(t, len(want), len(replacedGot))
			switch version {
			case "v2":
				var wantResult, gotResult resultv2.Result
				err := yaml.Unmarshal(want, &wantResult)
				require.NoError(t, err)
				err = yaml.Unmarshal(replacedGot, &gotResult)
				require.NoError(t, err)

				compareResults(t, &wantResult, &gotResult)
			case "v1":
				assert.YAMLEq(t, string(want), string(replacedGot))
			}
		})
	}
}

func serveApps(directory string, port string, t *testing.T) {
	http.Handle("/", http.FileServer(http.Dir(directory)))
	go func() {
		err := http.ListenAndServe(":"+port, nil)
		if err != nil {
			t.Fail()
		}
	}()
}

func compareResults(t *testing.T, result1, result2 *resultv2.Result) {
	assert.Equal(t, result1.Metadata.Version, result1.Metadata.Version, "Metadata versions should be equal")
	compareHeader(t, result1.Header, result2.Header)
	assert.Equal(t, result1.OverallStatus, result2.OverallStatus, "OverallStatus should be equal")
	compareStatistics(t, result1.Statistics, result2.Statistics)

	assert.Equal(t, len(result1.Chapters), len(result2.Chapters), "Number of chapters should be equal")
	for chapterKey, chapter1 := range result1.Chapters {
		chapter2, chapterExists := result2.Chapters[chapterKey]
		assert.True(t, chapterExists, "Chapter %s should exist in both results", chapterKey)
		compareChapters(t, chapter1, chapter2, chapterKey)
	}

	if result1.Finalize != nil && result2.Finalize != nil {
		compareFinalize(t, result1.Finalize, result2.Finalize)
	}
}

func compareHeader(t *testing.T, header1, header2 resultv2.Header) {
	assert.Equal(t, header1.Name, header2.Name, "Header names should be equal")
	assert.Equal(t, header1.Version, header2.Version, "Header versions should be equal")
	assert.Equal(t, header1.Date, header2.Date, "Header dates should be equal")
	assert.Equal(t, header1.ToolVersion, header2.ToolVersion, "Header tool versions should be equal")
}

func compareStatistics(t *testing.T, stats1, stats2 resultv2.Statistics) {
	assert.Equal(t, stats1.CountChecks, stats2.CountChecks, "Counted checks should be equal")
	assert.Equal(t, stats1.CountAutomatedChecks, stats2.CountAutomatedChecks, "Counted automated checks should be equal")
	assert.Equal(t, stats1.CountManualChecks, stats2.CountManualChecks, "Counted manual checks should be equal")
	assert.Equal(t, stats1.CountUnansweredChecks, stats2.CountUnansweredChecks, "Counted unanswered checks should be equal")
	assert.Equal(t, stats1.CountSkippedChecks, stats2.CountSkippedChecks, "Counted skipped checks should be equal")
	assert.Equal(t, stats1.PercentageAutomated, stats2.PercentageAutomated, "Degree of automation should be equal")
	assert.Equal(t, stats1.PercentageDone, stats2.PercentageDone, "Degree of completion should be equal")
}

func compareChapters(t *testing.T, chapter1, chapter2 *resultv2.Chapter, chapterKey string) {
	assert.True(t, chapter1 != nil && chapter2 != nil)
	assert.Equal(t, chapter1.Title, chapter2.Title, "Chapter %s titles should be equal", chapterKey)
	assert.Equal(t, chapter1.Status, chapter2.Status, "Chapter %s status should be equal", chapterKey)
	assert.Equal(t, chapter1.Text, chapter2.Text, "Chapter %s text should be equal", chapterKey)

	assert.Equal(t, len(chapter1.Requirements), len(chapter2.Requirements), "Number of requirements should be equal for chapter %s", chapterKey)
	for reqKey, req1 := range chapter1.Requirements {
		req2, reqExists := chapter2.Requirements[reqKey]
		assert.True(t, reqExists, "Requirement %s should exist in both results for chapter %s", reqKey, chapterKey)
		compareRequirements(t, req1, req2, reqKey, chapterKey)
	}
}

func compareRequirements(t *testing.T, req1, req2 *resultv2.Requirement, reqKey, chapterKey string) {
	assert.Equal(t, req1.Title, req2.Title, "Requirement %s titles should be equal in chapter %s", reqKey, chapterKey)
	assert.Equal(t, req1.Text, req2.Text, "Requirement %s texts should be equal in chapter %s", reqKey, chapterKey)
	assert.Equal(t, req1.Status, req2.Status, "Requirement %s status should be equal in chapter %s", reqKey, chapterKey)

	assert.Equal(t, len(req1.Checks), len(req2.Checks), "Number of checks should be equal for requirement %s in chapter %s", reqKey, chapterKey)
	for checkKey, check1 := range req1.Checks {
		check2, checkExists := req2.Checks[checkKey]
		assert.True(t, checkExists, "Check %s should exist in both requirements for chapter %s", checkKey, chapterKey)
		compareChecks(t, check1, check2, checkKey, reqKey, chapterKey)
	}
}

func compareChecks(t *testing.T, check1, check2 *resultv2.Check, checkKey, reqKey, chapterKey string) {
	assert.Equal(t, check1.Title, check2.Title, "Check %s titles should be equal in requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, check1.Type, check2.Type, "Check %s type should be equal in requirement %s of chapter %s", checkKey, reqKey, chapterKey)

	assert.Equal(t, len(check1.Autopilots), len(check2.Autopilots), "Number of autopilots should be equal for check %s in requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	for i := range check1.Autopilots {
		compareAutopilots(t, check1.Autopilots[i], check2.Autopilots[i], checkKey, reqKey, chapterKey)
	}

	compareEvaluation(t, check1.Evaluation, check2.Evaluation, checkKey, reqKey, chapterKey)
}

func compareAutopilots(t *testing.T, auto1, auto2 resultv2.Autopilot, checkKey, reqKey, chapterKey string) {
	assert.Equal(t, auto1.Name, auto2.Name, "Autopilot names should be equal for check %s in requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, len(auto1.Steps), len(auto2.Steps), "Number of steps should be equal for autopilot in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)

	for i := range auto1.Steps {
		compareSteps(t, auto1.Steps[i], auto2.Steps[i], checkKey, reqKey, chapterKey)
	}
}

func compareSteps(t *testing.T, step1, step2 resultv2.Step, checkKey, reqKey, chapterKey string) {
	assert.Equal(t, step1.Title, step2.Title, "Step titles should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.Id, step2.Id, "Step ids should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.Depends, step2.Depends, "Step dependencies should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	compareLogs(t, step1.Logs, step2.Logs, "Step logs should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.Warnings, step2.Warnings, "Step Warnings should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.Messages, step2.Messages, "Step Messages should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.ConfigFiles, step2.ConfigFiles, "Step config files should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.OutputDir, step2.OutputDir, "Step output dirs should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.ResultFile, step2.ResultFile, "Step result files should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.InputDirs, step2.InputDirs, "Step input dirs should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, step1.ExitCode, step2.ExitCode, "Step exit codes should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
}

func compareEvaluation(t *testing.T, eval1, eval2 resultv2.Evaluation, checkKey, reqKey, chapterKey string) {
	assert.Equal(t, eval1.Status, eval2.Status, "Evaluation status should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, eval1.Reason, eval2.Reason, "Evaluation reason should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)

	assert.Equal(t, len(eval1.Results), len(eval2.Results), "Number of results should be equal for evaluation in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	for i := range eval1.Results {
		compareEvaluationResults(t, eval1.Results[i], eval2.Results[i], checkKey, reqKey, chapterKey)
	}

	compareLogs(t, eval1.Logs, eval2.Logs, "Evaluation logs should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, eval1.Warnings, eval2.Warnings, "Evaluation warnings should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, eval1.Messages, eval2.Messages, "Evaluation messages should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, eval1.ConfigFiles, eval2.ConfigFiles, "Evaluation config files should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, eval1.ExitCode, eval2.ExitCode, "Evaluation exit codes should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
}

func compareEvaluationResults(t *testing.T, result1, result2 resultv2.EvaluationResult, checkKey, reqKey, chapterKey string) {
	assert.Equal(t, result1.Hash, result2.Hash, "Result hash should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, result1.Criterion, result2.Criterion, "Result criterion should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, result1.Fulfilled, result2.Fulfilled, "Result fulfillment should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, result1.Justification, result2.Justification, "Result justification should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
	assert.Equal(t, result1.Metadata, result2.Metadata, "Result metadata should be equal in check %s, requirement %s of chapter %s", checkKey, reqKey, chapterKey)
}

func compareFinalize(t *testing.T, finalize1, finalize2 *resultv2.Finalize) {

	compareLogs(t, finalize1.Logs, finalize2.Logs, "Finalize logs should be equal")
	assert.Equal(t, finalize1.Warnings, finalize2.Warnings, "Finalize warnings should be equal")
	assert.Equal(t, finalize1.Messages, finalize2.Messages, "Finalize messages should be equal")
	assert.Equal(t, finalize1.ConfigFiles, finalize2.ConfigFiles, "Finalize config files should be equal")
	assert.Equal(t, finalize1.ExitCode, finalize2.ExitCode, "Finalize exit codes should be equal")
}

func compareLogs(t *testing.T, logs1, logs2 []string, msgAndArgs ...interface{}) {
	assert.Equal(t, len(logs1), len(logs2), append(msgAndArgs, "Log count should be equal")...)
	for i := range logs1 {
		assert.JSONEq(t, logs1[i], logs2[i], append(msgAndArgs, "Log %d should match", i)...)
	}
}
