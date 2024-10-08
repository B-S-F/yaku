package orchestrator

import (
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOrchestrator(t *testing.T) {
	type fields struct {
		rootWorkDir string
		timeout     time.Duration
	}
	type args struct {
		manuals    []model.ManualCheck
		autopilots []model.AutopilotCheck
		env        map[string]string
		secrets    map[string]string
	}
	type want struct {
		result model.RunResult
		err    error
	}
	tests := map[string]struct {
		fields func(dir string) fields
		args   args
		want   func(dir string) want
	}{
		"should return empty result when no checks to run": {
			fields: func(dir string) fields {
				return fields{rootWorkDir: dir, timeout: 10 * time.Minute}
			},
			args: args{manuals: nil, autopilots: nil},
			want: func(dir string) want {
				return want{result: model.RunResult{}, err: nil}
			},
		},
		"should return manual check result": {
			fields: func(dir string) fields {
				return fields{rootWorkDir: dir, timeout: 10 * time.Minute}
			},
			args: args{manuals: []model.ManualCheck{{Item: model.Item{
				Chapter:     configuration.Chapter{Id: "1", Title: "chapter1"},
				Requirement: configuration.Requirement{Id: "1", Title: "requirement1"},
				Check:       configuration.Check{Id: "1", Title: "check1"},
			},
				Manual: configuration.Manual{Status: "GREEN", Reason: "always green"},
			}}},
			want: func(dir string) want {
				return want{result: model.RunResult{
					Manuals: []model.ManualRun{{ManualCheck: model.ManualCheck{
						Item: model.Item{
							Chapter:     configuration.Chapter{Id: "1", Title: "chapter1"},
							Requirement: configuration.Requirement{Id: "1", Title: "requirement1"},
							Check:       configuration.Check{Id: "1", Title: "check1"},
						},
						Manual: configuration.Manual{Status: "GREEN", Reason: "always green"},
					},
						Result: &model.ManualResult{Status: "GREEN", Reason: "always green"},
					}}},
				}
			},
		},
		"should return multiple manual check results": {
			fields: func(dir string) fields {
				return fields{rootWorkDir: dir, timeout: 10 * time.Minute}
			},
			args: args{
				manuals: []model.ManualCheck{
					{Item: model.Item{
						Chapter:     configuration.Chapter{Id: "1", Title: "chapter1"},
						Requirement: configuration.Requirement{Id: "1", Title: "requirement1"},
						Check:       configuration.Check{Id: "1", Title: "check1"},
					},
						Manual: configuration.Manual{Status: "GREEN", Reason: "always green"},
					},
					{Item: model.Item{
						Chapter:     configuration.Chapter{Id: "2", Title: "chapter2"},
						Requirement: configuration.Requirement{Id: "2", Title: "requirement2"},
						Check:       configuration.Check{Id: "2", Title: "check2"},
					},
						Manual: configuration.Manual{Status: "GREEN", Reason: "I AM green"},
					},
				},
			},
			want: func(dir string) want {
				return want{result: model.RunResult{
					Manuals: []model.ManualRun{
						{ManualCheck: model.ManualCheck{Item: model.Item{
							Chapter:     configuration.Chapter{Id: "1", Title: "chapter1"},
							Requirement: configuration.Requirement{Id: "1", Title: "requirement1"},
							Check:       configuration.Check{Id: "1", Title: "check1"},
						},
							Manual: configuration.Manual{Status: "GREEN", Reason: "always green"},
						},
							Result: &model.ManualResult{Status: "GREEN", Reason: "always green"},
						},
						{ManualCheck: model.ManualCheck{Item: model.Item{
							Chapter:     configuration.Chapter{Id: "2", Title: "chapter2"},
							Requirement: configuration.Requirement{Id: "2", Title: "requirement2"},
							Check:       configuration.Check{Id: "2", Title: "check2"},
						},
							Manual: configuration.Manual{Status: "GREEN", Reason: "I AM green"},
						},
							Result: &model.ManualResult{Status: "GREEN", Reason: "I AM green"},
						},
					}},
				}
			},
		},
		"should return autopilot check result": {
			fields: func(dir string) fields {
				return fields{rootWorkDir: dir, timeout: 10 * time.Minute}
			},
			args: args{
				autopilots: []model.AutopilotCheck{
					simpleAutopilotCheck(),
				},
			},
			want: func(dir string) want {
				return want{result: model.RunResult{
					Autopilots: []model.AutopilotRun{
						{
							AutopilotCheck: simpleAutopilotCheck(),
							Result:         simpleAutopilotCheckResult(dir),
						},
					}}}
			},
		},
		"should return multiple autopilot checks results": {
			fields: func(dir string) fields {
				return fields{rootWorkDir: dir, timeout: 10 * time.Minute}
			},
			args: args{
				autopilots: []model.AutopilotCheck{
					simpleAutopilotCheck(),
					{
						Item: model.Item{
							Chapter:     configuration.Chapter{Id: "chapter2"},
							Requirement: configuration.Requirement{Id: "requirement2"},
							Check:       configuration.Check{Id: "check2"},
						},
						Autopilot: model.Autopilot{
							Name: "autopilot2",
							Steps: [][]model.Step{{
								model.Step{
									Title: "write hex file",
									Configs: map[string]string{
										"config.yaml": "metadata",
									},
									Depends: []string{},
									ID:      "write",
									Run:     "echo '0101' > $AUTOPILOT_OUTPUT_DIR/data.hex\necho 'done writing'",
								},
								model.Step{
									Title: "transform to json",
									Configs: map[string]string{
										"config.yaml": "temporal",
									},
									Depends: []string{"write"},
									ID:      "transform",
									Run: `data="{\"write\": \"$ENV_VAR1 ($(cat $AUTOPILOT_INPUT_DIRS/data.hex))\"}"; echo "$data" > "$AUTOPILOT_RESULT_FILE"
echo 'done transforming'`},
							}},
							Env: map[string]string{
								"ENV_VAR1": "value1",
							},
							Evaluate: model.Evaluate{
								Run: "data=$(cat \"$EVALUATOR_INPUT_FILES\"); expected='{\"write\": \"value1 (0101)\"}'; [[ \"$data\" == \"$expected\" ]] && echo '{\"status\": \"GREEN\", \"reason\": \"file matches\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": true, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}' || echo '{\"status\": \"RED\", \"reason\": \"file does not match\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": false, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}'",
							},
						},
					},
				},
			},
			want: func(dir string) want {
				return want{result: model.RunResult{
					Autopilots: []model.AutopilotRun{
						{
							AutopilotCheck: simpleAutopilotCheck(),
							Result:         simpleAutopilotCheckResult(dir),
						},
						{
							AutopilotCheck: model.AutopilotCheck{
								Item: model.Item{
									Chapter:     configuration.Chapter{Id: "chapter2"},
									Requirement: configuration.Requirement{Id: "requirement2"},
									Check:       configuration.Check{Id: "check2"},
								},
								Autopilot: model.Autopilot{
									Name: "autopilot2",
									Steps: [][]model.Step{{
										model.Step{
											Title: "write hex file",
											Configs: map[string]string{
												"config.yaml": "metadata",
											},
											Depends: []string{},
											ID:      "write",
											Run:     "echo '0101' > $AUTOPILOT_OUTPUT_DIR/data.hex\necho 'done writing'",
										},
										model.Step{
											Title: "transform to json",
											Configs: map[string]string{
												"config.yaml": "temporal",
											},
											Depends: []string{"write"},
											ID:      "transform",
											Run: `data="{\"write\": \"$ENV_VAR1 ($(cat $AUTOPILOT_INPUT_DIRS/data.hex))\"}"; echo "$data" > "$AUTOPILOT_RESULT_FILE"
echo 'done transforming'`},
									}},
									Env: map[string]string{
										"ENV_VAR1": "value1",
									},
									Evaluate: model.Evaluate{
										Run: "data=$(cat \"$EVALUATOR_INPUT_FILES\"); expected='{\"write\": \"value1 (0101)\"}'; [[ \"$data\" == \"$expected\" ]] && echo '{\"status\": \"GREEN\", \"reason\": \"file matches\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": true, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}' || echo '{\"status\": \"RED\", \"reason\": \"file does not match\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": false, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}'",
									},
								},
							},
							Result: &model.AutopilotResult{
								StepResults: []model.StepResult{
									{Logs: []model.LogEntry{{Source: "stdout", Text: "done writing"}}, ID: "write", OutputDir: fmt.Sprintf("%s/chapter2_requirement2_check2/steps/write/files", dir)},
									{Logs: []model.LogEntry{{Source: "stdout", Text: "done transforming"}}, ID: "transform", OutputDir: fmt.Sprintf("%s/chapter2_requirement2_check2/steps/transform/files", dir), ResultFile: fmt.Sprintf("%s/chapter2_requirement2_check2/steps/transform/data.json", dir), InputDirs: []string{fmt.Sprintf("%s/chapter2_requirement2_check2/steps/write/files", dir)}},
								},
								EvaluateResult: model.EvaluateResult{
									Results: []model.Result{{
										Criterion:     "criteria1",
										Fulfilled:     true,
										Justification: "reason1",
										Metadata: map[string]string{
											"package":  "package1",
											"severity": "HIGH",
										},
									}},
									ExitCode: 0,
									Logs: []model.LogEntry{
										{Source: "stdout", Json: map[string]interface{}{"status": "GREEN", "reason": "file matches", "result": map[string]interface{}{"criterion": "criteria1", "fulfilled": true, "justification": "reason1", "metadata": map[string]interface{}{"severity": "HIGH", "package": "package1"}}}},
									},
									Status: "GREEN",
									Reason: "file matches",
								},
								Name: "autopilot2",
							},
						},
					}}}
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			tmpDir := t.TempDir()

			defaultLogger := logger.NewCommon(logger.Settings{
				Secrets: nil,
				File:    filepath.Join(tmpDir, "onyx.log"),
			})
			logger.Set(defaultLogger)

			o := &Orchestrator{
				rootWorkDir: tt.fields(tmpDir).rootWorkDir,
				timeout:     tt.fields(tmpDir).timeout,
				logger:      logger.Get(),
			}
			got, err := o.Run(tt.args.manuals, tt.args.autopilots, tt.args.env, tt.args.secrets)
			want := tt.want(tmpDir)
			require.Equal(t, want.err != nil, err != nil)
			if tt.want(tmpDir).err != nil {
				assert.ErrorContains(t, err, want.err.Error())
			}
			for _, wantRes := range want.result.Autopilots {
				for _, gotRes := range got.Autopilots {
					if wantRes.AutopilotCheck.Item == gotRes.AutopilotCheck.Item {
						assert.Equal(t, wantRes, gotRes)
					}
				}
			}
			for _, wantRes := range want.result.Manuals {
				for _, gotRes := range got.Manuals {
					if wantRes.ManualCheck.Item == gotRes.ManualCheck.Item {
						assert.Equal(t, wantRes, gotRes)
					}
				}
			}
		})
	}
}

func simpleAutopilotCheck() model.AutopilotCheck {
	return model.AutopilotCheck{
		Item: model.Item{
			Chapter:     configuration.Chapter{Id: "chapter"},
			Requirement: configuration.Requirement{Id: "requirement"},
			Check:       configuration.Check{Id: "check"},
		},
		Autopilot: model.Autopilot{
			Name: "autopilot",
			Steps: [][]model.Step{{
				model.Step{
					Title: "write hello word",
					Configs: map[string]string{
						"config1": "value1",
						"config2": "value2",
					},
					Depends: []string{},
					ID:      "write",
					Run:     "echo '{\"key\": \"hello world\"}' > $AUTOPILOT_OUTPUT_DIR/data.txt\necho 'done writing'",
				},
				model.Step{
					Title: "say hello word",
					Configs: map[string]string{
						"config1": "value1",
						"config2": "value2",
					},
					Depends: []string{"write"},
					ID:      "echo",
					Run:     "cat $AUTOPILOT_INPUT_DIRS/data.txt > $AUTOPILOT_RESULT_FILE\necho 'done echoing'",
				},
			}},
			Env: map[string]string{
				"ENV_VAR1": "value1",
				"ENV_VAR2": "value2",
			},
			Evaluate: model.Evaluate{
				Run: "data=$(cat \"$EVALUATOR_INPUT_FILES\"); expected='{\"key\": \"hello world\"}'; [[ \"$data\" == \"$expected\" ]] && echo '{\"status\": \"GREEN\", \"reason\": \"file matches\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": true, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}' || echo '{\"status\": \"RED\", \"reason\": \"file does not match\", \"result\": {\"criterion\": \"criteria1\", \"fulfilled\": false, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}'",
			},
		},
	}
}

func simpleAutopilotCheckResult(dir string) *model.AutopilotResult {
	return &model.AutopilotResult{
		StepResults: []model.StepResult{
			{Logs: []model.LogEntry{{Source: "stdout", Text: "done writing"}}, ID: "write", OutputDir: fmt.Sprintf("%s/chapter_requirement_check/steps/write/files", dir)},
			{Logs: []model.LogEntry{{Source: "stdout", Text: "done echoing"}}, ID: "echo", OutputDir: fmt.Sprintf("%s/chapter_requirement_check/steps/echo/files", dir), ResultFile: fmt.Sprintf("%s/chapter_requirement_check/steps/echo/data.json", dir), InputDirs: []string{fmt.Sprintf("%s/chapter_requirement_check/steps/write/files", dir)}},
		},
		EvaluateResult: model.EvaluateResult{
			Results: []model.Result{{
				Criterion:     "criteria1",
				Fulfilled:     true,
				Justification: "reason1",
				Metadata: map[string]string{
					"package":  "package1",
					"severity": "HIGH",
				},
			}},
			ExitCode: 0,
			Logs: []model.LogEntry{
				{Source: "stdout", Json: map[string]interface{}{"status": "GREEN", "reason": "file matches", "result": map[string]interface{}{"criterion": "criteria1", "fulfilled": true, "justification": "reason1", "metadata": map[string]interface{}{"severity": "HIGH", "package": "package1"}}}},
			},
			Status: "GREEN",
			Reason: "file matches",
		},
		Name: "autopilot",
	}
}
