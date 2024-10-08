package result

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestCreator_WriteResultFile(t *testing.T) {
	type args struct {
		res  Result
		path string
	}
	tests := map[string]struct {
		args args
	}{
		"should_write_result_yaml_with_manual_&_automation_chapters": {
			args: args{res: Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "RED",
				Chapters: map[string]*Chapter{
					"1": simpleManualChapter(),
					"2": simpleAutomationChapter(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 1, CountManualChecks: 1, PercentageDone: 100, PercentageAutomated: 50},
			},
				path: "result.yaml",
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			c := &Creator{logger: logger.NewAutopilot()}

			p := filepath.Join(t.TempDir(), tt.args.path)

			err := c.WriteResultFile(tt.args.res, p)
			assert.NoError(t, err)

			// assert written file exists
			_, err = os.Stat(p)
			assert.NoError(t, err)

			content, err := os.ReadFile(p)
			assert.NoError(t, err)

			var readResult Result
			err = yaml.Unmarshal(content, &readResult)
			assert.NoError(t, err)

			// assert content of written file
			assert.YAMLEq(t, simpleResultYAML(), string(content))
		})
	}
}

func TestCreator_AppendFinalizeResult(t *testing.T) {
	type args struct {
		res            *Result
		finalizeResult model.FinalizeResult
		finalize       model.Finalize
	}
	tests := map[string]struct {
		args args
		want *Result
	}{
		"should_append_finalize_result_to_result_object": {
			args: args{
				finalizeResult: model.FinalizeResult{
					Logs: []model.LogEntry{
						{Source: "stdout", Text: "log1"},
						{Source: "stdout", Json: map[string]interface{}{"warning": "this is a warning"}},
						{Source: "stdout", Json: map[string]interface{}{"warning": "another warning"}},
						{Source: "stdout", Json: map[string]interface{}{"message": "this is a message"}},
						{Source: "stderr", Text: "some error"},
					},
					ExitCode:   0,
					OutputPath: "out.json",
				},
				finalize: model.Finalize{Env: map[string]string{"env": "value"}, Configs: map[string]string{"cfg": "content"}, Run: "echo 'hello world' > out.json"},
				res: &Result{
					Metadata:      Metadata{Version: "v2"},
					Header:        Header{Version: "1.0", Name: "test"},
					OverallStatus: "RED",
					Chapters: map[string]*Chapter{
						"1": simpleManualChapter(),
						"2": simpleAutomationChapter(),
					},
					Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 1, CountManualChecks: 1, PercentageDone: 100, PercentageAutomated: 50},
				},
			},
			want: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "RED",
				Chapters: map[string]*Chapter{
					"1": simpleManualChapter(),
					"2": simpleAutomationChapter(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 1, CountManualChecks: 1, PercentageDone: 100, PercentageAutomated: 50},
				Finalize: &Finalize{
					Logs: []string{
						"{\"source\":\"stdout\",\"text\":\"log1\"}",
						"{\"source\":\"stdout\",\"json\":{\"warning\":\"this is a warning\"}}",
						"{\"source\":\"stdout\",\"json\":{\"warning\":\"another warning\"}}",
						"{\"source\":\"stdout\",\"json\":{\"message\":\"this is a message\"}}",
						"{\"source\":\"stderr\",\"text\":\"some error\"}",
					},
					Warnings: []string{
						"this is a warning",
						"another warning",
					},
					Messages:    []string{"this is a message"},
					ConfigFiles: []string{"cfg"},
					ExitCode:    0,
				},
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			c := &Creator{logger: logger.NewAutopilot()}
			err := c.AppendFinalizeResult(tt.args.res, tt.args.finalizeResult, tt.args.finalize)
			require.NoError(t, err)

			assert.Equal(t, tt.want, tt.args.res)
		})
	}
}

func simpleResultYAML() string {
	return `
metadata:
    version: v2
header:
    name: test
    version: "1.0"
    date: ""
    toolVersion: ""
overallStatus: RED
statistics:
    counted-checks: 2
    counted-automated-checks: 1
    counted-manual-check: 1
    counted-unanswered-checks: 0
    counted-skipped-checks: 0
    degree-of-automation: 50
    degree-of-completion: 100
chapters:
    "1":
        title: chapter1
        text: my chapter
        status: GREEN
        requirements:
            "1":
                title: requirement1
                text: my requirement
                status: GREEN
                checks:
                    "1":
                        title: check1
                        type: manual
                        evaluation:
                            status: GREEN
                            reason: It should be GREEN
    "2":
        title: chapter
        text: my chapter
        status: GREEN
        requirements:
            "1":
                title: requirement1
                text: my requirement
                status: GREEN
                checks:
                    "1":
                        title: check1
                        type: automation
                        autopilots:
                            - name: pdf-checker
                              steps:
                                - title: fetch1
                                  id: fetch1
                                  depends: []
                                  logs:
                                    - '{"source":"stdout","text":"log1"}'
                                    - '{"source":"stdout","json":{"warning":"this is a warning"}}'
                                    - '{"source":"stdout","json":{"warning":"another warning"}}'
                                    - '{"source":"stdout","json":{"message":"this is a message"}}'
                                    - '{"source":"stderr","text":"some error"}'
                                  warnings:
                                    - this is a warning
                                    - another warning
                                  messages:
                                    - this is a message
                                  configFiles:
                                    - cfg.yaml
                                  outputDir: fetch1/files
                                  resultFile: fetch1/data.json
                                  inputDirs: []
                                  exitCode: 0
                                - title: fetch2
                                  id: fetch2
                                  depends: []
                                  logs:
                                    - '{"source":"stdout","text":"log1"}'
                                  configFiles: []
                                  outputDir: fetch2/files
                                  resultFile: fetch2/data.json
                                  inputDirs: []
                                  exitCode: 0
                                - title: transform
                                  id: transform
                                  depends:
                                    - fetch1
                                    - fetch2
                                  logs:
                                    - '{"source":"stdout","text":"log1"}'
                                  configFiles: []
                                  outputDir: transform/files
                                  resultFile: transform/data.json
                                  inputDirs:
                                    - fetch1
                                    - fetch2
                                  exitCode: 0
                        evaluation:
                            status: GREEN
                            reason: should be GREEN
                            results:
                                - criterion: criterion
                                  fulfilled: true
                                  justification: justified
                            configFiles:
                                - cfg.yaml
                            logs:
                                - '{"source":"stdout","text":"log1"}'
                                - '{"source":"stdout","json":{"warning":"this is a warning"}}'
                                - '{"source":"stdout","json":{"warning":"another warning"}}'
                                - '{"source":"stdout","json":{"message":"this is a message"}}'
                                - '{"source":"stderr","text":"some error"}'
                            warnings:
                                - this is a warning
                                - another warning
                            messages:
                                - this is a message`
}
