package result

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreator_Create(t *testing.T) {
	startDate := time.Now().Add(-1 * time.Minute)
	type want struct {
		result *Result
		err    error
	}
	type args struct {
		ep        model.ExecutionPlan
		runResult model.RunResult
	}
	tests := map[string]struct {
		args args
		want want
	}{
		"return_zero_value_result_when_no_runs": {
			args: args{
				ep:        model.ExecutionPlan{},
				runResult: model.RunResult{},
			},
			want: want{result: &Result{Metadata: Metadata{Version: "v2"}, Chapters: make(map[string]*Chapter)}},
		},
		"return_result_when_single_manual_run": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Manuals: []model.ManualRun{
					newManualRunBuilder().get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "GREEN",
				Chapters: map[string]*Chapter{
					"1": simpleManualChapter(),
				},
				Statistics: Statistics{CountChecks: 1, CountManualChecks: 1, PercentageDone: 100},
			}},
		},
		"return_result_when_multiple_manual_runs_with_same_status": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Manuals: []model.ManualRun{
					newManualRunBuilder().get(),
					newManualRunBuilder().chapterID("2").chapterTitle("chapter2").checkId("1").checkTitle("check 1").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "GREEN",
				Chapters: map[string]*Chapter{
					"1": simpleManualChapter(),
					"2": {
						Title:  "chapter2",
						Text:   "my chapter",
						Status: "GREEN",
						Requirements: map[string]*Requirement{
							"1": {
								Title:  "requirement1",
								Text:   "my requirement",
								Status: "GREEN",
								Checks: map[string]*Check{
									"1": {
										Title: "check 1",
										Type:  "manual",
										Evaluation: Evaluation{
											Status: "GREEN",
											Reason: "It should be GREEN",
										},
									},
								},
							},
						},
					},
				},
				Statistics: Statistics{CountChecks: 2, CountManualChecks: 2, PercentageDone: 100},
			}},
		},
		"return_result_when_multiple_manual_runs_with_different_statuses": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Manuals: []model.ManualRun{
					newManualRunBuilder().status("YELLOW").reason("always yellow").get(),
					newManualRunBuilder().chapterID("2").chapterTitle("chapter2").status("GREEN").reason("always green").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "YELLOW",
				Chapters: map[string]*Chapter{
					"1": {
						Title:  "chapter1",
						Text:   "my chapter",
						Status: "YELLOW",
						Requirements: map[string]*Requirement{
							"1": {
								Title:  "requirement1",
								Text:   "my requirement",
								Status: "YELLOW",
								Checks: map[string]*Check{
									"1": {
										Title: "check1",
										Type:  "manual",
										Evaluation: Evaluation{
											Status: "YELLOW",
											Reason: "always yellow",
										},
									},
								},
							},
						},
					},
					"2": {
						Title:  "chapter2",
						Text:   "my chapter",
						Status: "GREEN",
						Requirements: map[string]*Requirement{
							"1": {
								Title:  "requirement1",
								Text:   "my requirement",
								Status: "GREEN",
								Checks: map[string]*Check{
									"1": {
										Title: "check1",
										Type:  "manual",
										Evaluation: Evaluation{
											Status: "GREEN",
											Reason: "always green",
										},
									},
								},
							},
						},
					},
				},
				Statistics: Statistics{CountChecks: 2, CountManualChecks: 2, PercentageDone: 100},
			}},
		},
		"return_result_when_single_autopilot_run": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Autopilots: []model.AutopilotRun{
					newAutopilotRunBuilder().get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "GREEN",
				Chapters: map[string]*Chapter{
					"1": simpleAutomationChapter(),
				},
				Statistics: Statistics{CountChecks: 1, CountAutomatedChecks: 1, PercentageDone: 100, PercentageAutomated: 100},
			}},
		},
		"return_result_when_multiple_autopilot_runs": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Autopilots: []model.AutopilotRun{
					newAutopilotRunBuilder().get(),
					newAutopilotRunBuilder().chapterID("2").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "GREEN",
				Chapters: map[string]*Chapter{
					"1": simpleAutomationChapter(),
					"2": simpleAutomationChapter(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 2, PercentageDone: 100, PercentageAutomated: 100},
			}},
		},
		"return_result_when_multiple_autopilot_runs_with_different_statuses_for_different_chapters": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Autopilots: []model.AutopilotRun{
					newAutopilotRunBuilder().get(),
					newAutopilotRunBuilder().chapterID("2").status("RED").reason("is red").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "RED",
				Chapters: map[string]*Chapter{
					"1": simpleAutomationChapter(),
					"2": func() *Chapter {
						c := simpleAutomationChapter()
						c.Status = "RED"
						c.Requirements["1"].Status = "RED"
						c.Requirements["1"].Checks["1"].Evaluation.Status = "RED"
						c.Requirements["1"].Checks["1"].Evaluation.Reason = "is red"
						return c
					}(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 2, PercentageDone: 100, PercentageAutomated: 100},
			}},
		},
		"return_result_when_multiple_autopilot_runs_with_different_statuses_for_different_requirements": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Autopilots: []model.AutopilotRun{
					newAutopilotRunBuilder().get(),
					newAutopilotRunBuilder().requirementID("2").status("RED").reason("is red").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "RED",
				Chapters: map[string]*Chapter{
					"1": func() *Chapter {
						c := simpleAutomationChapter()
						c.Status = "RED"
						c.Requirements["2"] = simpleAutomationChapter().Requirements["1"]
						c.Requirements["2"].Status = "RED"
						c.Requirements["2"].Checks["1"].Evaluation.Status = "RED"
						c.Requirements["2"].Checks["1"].Evaluation.Reason = "is red"
						return c
					}(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 2, PercentageDone: 100, PercentageAutomated: 100},
			}},
		},
		"return_result_when_multiple_autopilot_runs_with_different_statuses_for_different_checks": {
			args: args{
				ep: *simpleExecPlan(),
				runResult: model.RunResult{Autopilots: []model.AutopilotRun{
					newAutopilotRunBuilder().get(),
					newAutopilotRunBuilder().checkID("2").status("RED").reason("is red").get(),
				}},
			},
			want: want{result: &Result{
				Metadata:      Metadata{Version: "v2"},
				Header:        Header{Version: "1.0", Name: "test"},
				OverallStatus: "RED",
				Chapters: map[string]*Chapter{
					"1": func() *Chapter {
						c := simpleAutomationChapter()
						c.Status = "RED"
						c.Requirements["1"].Checks["2"] = simpleAutomationChapter().Requirements["1"].Checks["1"]
						c.Requirements["1"].Status = "RED"
						c.Requirements["1"].Checks["2"].Evaluation.Status = "RED"
						c.Requirements["1"].Checks["2"].Evaluation.Reason = "is red"
						return c
					}(),
				},
				Statistics: Statistics{CountChecks: 2, CountAutomatedChecks: 2, PercentageDone: 100, PercentageAutomated: 100},
			}},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			c := &Creator{logger: logger.NewAutopilot()}

			got, err := c.Create(tt.args.ep, tt.args.runResult)
			require.Equal(t, tt.want.err != nil, err != nil)
			if tt.want.err != nil {
				assert.ErrorContains(t, err, tt.want.err.Error())
			}

			assert.Equal(t, tt.want.result.Metadata, got.Metadata)
			date, err := time.Parse(time.RFC3339, got.Header.Date)
			require.NoError(t, err)
			assert.WithinRange(t, date, startDate, time.Now())
			assert.Equal(t, tt.want.result.Header.Name, got.Header.Name)
			assert.Equal(t, tt.want.result.Header.Version, got.Header.Version)
			assert.Equal(t, tt.want.result.Header.ToolVersion, got.Header.ToolVersion)
			assert.Equal(t, tt.want.result.OverallStatus, got.OverallStatus)
			assert.Equal(t, tt.want.result.Statistics, got.Statistics)
			assert.Equal(t, tt.want.result.Chapters, got.Chapters)
			assert.Equal(t, tt.want.result.Finalize, got.Finalize)
		})
	}
}

type autopilotRunBuilder struct {
	autopilotRun model.AutopilotRun
}

func newAutopilotRunBuilder() *autopilotRunBuilder {
	return &autopilotRunBuilder{
		autopilotRun: simpleAutopilotRun(),
	}
}

func (a *autopilotRunBuilder) chapterID(ID string) *autopilotRunBuilder {
	a.autopilotRun.AutopilotCheck.Chapter.Id = ID
	return a
}

func (a *autopilotRunBuilder) requirementID(ID string) *autopilotRunBuilder {
	a.autopilotRun.AutopilotCheck.Requirement.Id = ID
	return a
}

func (a *autopilotRunBuilder) checkID(ID string) *autopilotRunBuilder {
	a.autopilotRun.AutopilotCheck.Check.Id = ID
	return a
}

func (a *autopilotRunBuilder) status(status string) *autopilotRunBuilder {
	a.autopilotRun.Result.EvaluateResult.Status = status
	return a
}

func (a *autopilotRunBuilder) reason(reason string) *autopilotRunBuilder {
	a.autopilotRun.Result.EvaluateResult.Reason = reason
	return a
}

func (a *autopilotRunBuilder) get() model.AutopilotRun {
	return a.autopilotRun
}

type manualRunBuilder struct {
	manualRun model.ManualRun
}

func newManualRunBuilder() *manualRunBuilder {
	return &manualRunBuilder{
		manualRun: simpleManualRun(),
	}
}

func (m *manualRunBuilder) chapterID(id string) *manualRunBuilder {
	m.manualRun.ManualCheck.Item.Chapter.Id = id
	return m
}

func (m *manualRunBuilder) chapterTitle(title string) *manualRunBuilder {
	m.manualRun.ManualCheck.Item.Chapter.Title = title
	return m
}

func (m *manualRunBuilder) checkId(id string) *manualRunBuilder {
	m.manualRun.ManualCheck.Item.Check.Id = id
	return m
}

func (m *manualRunBuilder) checkTitle(title string) *manualRunBuilder {
	m.manualRun.ManualCheck.Item.Check.Title = title
	return m
}

func (m *manualRunBuilder) status(status string) *manualRunBuilder {
	m.manualRun.ManualCheck.Manual.Status = status
	m.manualRun.Result.Status = status
	return m
}

func (m *manualRunBuilder) reason(reason string) *manualRunBuilder {
	m.manualRun.ManualCheck.Manual.Reason = reason
	m.manualRun.Result.Reason = reason
	return m
}

func (m *manualRunBuilder) get() model.ManualRun {
	return m.manualRun
}

func simpleAutopilotRun() model.AutopilotRun {
	return model.AutopilotRun{
		AutopilotCheck: model.AutopilotCheck{
			Item: model.Item{
				Chapter:     configuration.Chapter{Id: "1", Title: "chapter", Text: "my chapter"},
				Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"},
				Check:       configuration.Check{Id: "1", Title: "check1"},
			},
			AppReferences:  []*configuration.AppReference{{Repository: "github", Name: "sharepoint-fetcher", Version: "0.7.0"}},
			CheckEnv:       map[string]string{"SHAREPOINT_URL": "https://sharepoint.com/project1"},
			ValidationErrs: nil,
			Autopilot: model.Autopilot{
				Name: "pdf-checker",
				Env:  map[string]string{"VAR_1": "autopilot_var_1"},
				Steps: [][]model.Step{
					{
						model.Step{
							Title:   "fetch1",
							ID:      "fetch1",
							Env:     map[string]string{"key": "value"},
							Configs: map[string]string{"cfg.yaml": ""},
							Run:     "sharepoint-fetcher --config-file=..._1.yaml --output-dir=...",
						},
						model.Step{
							Title: "fetch2",
							ID:    "fetch2",
							Run:   "sharepoint-fetcher --config-file=..._2.yaml --output-dir=...",
						},
					},
					{
						model.Step{
							Title:   "transform",
							ID:      "transform",
							Depends: []string{"fetch1", "fetch2"},
							Run:     "pdf-sig-transformer --config-file=... --input-dir ... --input-dir ... --output-dir ...",
						},
					},
				},
				Evaluate: model.Evaluate{
					Env:     map[string]string{"result_file1": "result.json"},
					Configs: map[string]string{"cfg.yaml": ""},
					Run: `do-some-fancy-low-code-evaluation-here \
--config-file ... \
--output-dir ... \
--input-files ${AUTOPILOT_RESULT_FILES}`,
				},
			},
		},
		Result: &model.AutopilotResult{
			Name: "pdf-checker",
			StepResults: []model.StepResult{
				{
					ID:         "fetch1",
					OutputDir:  "fetch1/files",
					ResultFile: "fetch1/data.json",
					Logs: []model.LogEntry{
						{Source: "stdout", Text: "log1"},
						{Source: "stdout", Json: map[string]interface{}{"warning": "this is a warning"}},
						{Source: "stdout", Json: map[string]interface{}{"warning": "another warning"}},
						{Source: "stdout", Json: map[string]interface{}{"message": "this is a message"}},
						{Source: "stderr", Text: "some error"},
					},
					ExitCode: 0,
				},
				{
					ID:         "fetch2",
					OutputDir:  "fetch2/files",
					ResultFile: "fetch2/data.json",
					Logs:       []model.LogEntry{{Source: "stdout", Text: "log1"}},
					ExitCode:   0,
				},
				{
					ID:         "transform",
					OutputDir:  "transform/files",
					ResultFile: "transform/data.json",
					Logs:       []model.LogEntry{{Source: "stdout", Text: "log1"}},
					ExitCode:   0,
					InputDirs:  []string{"fetch1", "fetch2"},
				},
			},
			EvaluateResult: model.EvaluateResult{
				Reason: "should be GREEN",
				Status: "GREEN",
				Results: []model.Result{
					{
						Criterion:     "criterion",
						Fulfilled:     true,
						Justification: "justified",
						Metadata:      nil,
					},
				},
				ExitCode: 0,
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "log1"},
					{Source: "stdout", Json: map[string]interface{}{"warning": "this is a warning"}},
					{Source: "stdout", Json: map[string]interface{}{"warning": "another warning"}},
					{Source: "stdout", Json: map[string]interface{}{"message": "this is a message"}},
					{Source: "stderr", Text: "some error"},
				},
			},
		},
	}
}

func simpleManualRun() model.ManualRun {
	return model.ManualRun{
		ManualCheck: model.ManualCheck{
			Item: model.Item{
				Chapter:     configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"},
				Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"},
				Check:       configuration.Check{Id: "1", Title: "check1"},
			},
			Manual: configuration.Manual{Status: "GREEN", Reason: "It should be GREEN"},
		},
		Result: &model.ManualResult{Status: "GREEN", Reason: "It should be GREEN"},
	}
}

func simpleExecPlan() *model.ExecutionPlan {
	return &model.ExecutionPlan{
		Metadata:    configuration.Metadata{Version: "v2"},
		Header:      configuration.Header{Name: "test", Version: "1.0"},
		DefaultVars: map[string]string{"var1": "value1"},
		Env:         map[string]string{"env1": "env_value1"},
		Repositories: []configuration.Repository{{
			Name: "github",
			Type: "curl",
			Config: map[string]interface{}{
				"url":  "github.com",
				"auth": map[string]string{"type": "basic", "username": "user", "password": "pw"},
			},
		}},
		AutopilotChecks: []model.AutopilotCheck{
			{
				Item: model.Item{
					Chapter:     configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"},
					Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"},
					Check:       configuration.Check{Id: "1", Title: "check 1"},
				},
				AppReferences:  []*configuration.AppReference{{Repository: "github", Name: "sharepoint-fetcher", Version: "0.7.0"}},
				CheckEnv:       map[string]string{"SHAREPOINT_URL": "https://sharepoint.com/project1"},
				ValidationErrs: nil,
				Autopilot: model.Autopilot{
					Name: "pdf-checker",
					Env:  map[string]string{"VAR_1": "autopilot_var_1"},
					Steps: [][]model.Step{
						{
							model.Step{
								Title:   "fetch1",
								ID:      "fetch1",
								Env:     map[string]string{"key": "value"},
								Configs: map[string]string{"cfg.yaml": ""},
								Run:     "sharepoint-fetcher --config-file=..._1.yaml --output-dir=...",
							},
							model.Step{
								Title: "fetch2",
								ID:    "fetch2",
								Run:   "sharepoint-fetcher --config-file=..._2.yaml --output-dir=...",
							},
						},
						{
							model.Step{
								Title:   "transform",
								ID:      "transform",
								Depends: []string{"fetch1", "fetch2"},
								Run:     "pdf-sig-transformer --config-file=... --input-dir ... --input-dir ... --output-dir ...",
							},
						},
					},
					Evaluate: model.Evaluate{
						Env:     map[string]string{"result_file1": "result.json"},
						Configs: map[string]string{"cfg.yaml": ""},
						Run: `do-some-fancy-low-code-evaluation-here \
--config-file ... \
--output-dir ... \
--input-files ${AUTOPILOT_RESULT_FILES}`,
					},
				},
			},
			{
				Item: model.Item{
					Chapter:     configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"},
					Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"},
					Check:       configuration.Check{Id: "2", Title: "check 2"},
				},
				AppReferences:  []*configuration.AppReference{{Repository: "github", Name: "sharepoint-fetcher", Version: "0.7.0"}},
				CheckEnv:       nil,
				ValidationErrs: nil,
				Autopilot: model.Autopilot{
					Name: "pdf-checker",
					Env:  map[string]string{"VAR_1": "autopilot_var_1"},
					Steps: [][]model.Step{
						{
							model.Step{
								Title:   "fetch1",
								ID:      "fetch1",
								Env:     map[string]string{"key": "value"},
								Configs: map[string]string{"cfg.yaml": ""},
								Run:     "sharepoint-fetcher --config-file=..._1.yaml --output-dir=...",
							},
							model.Step{
								Title: "fetch2",
								ID:    "fetch2",
								Run:   "sharepoint-fetcher --config-file=..._2.yaml --output-dir=...",
							},
						},
						{
							model.Step{
								Title:   "transform",
								ID:      "transform",
								Depends: []string{"fetch1", "fetch2"},
								Run:     "pdf-sig-transformer --config-file=... --input-dir ... --input-dir ... --output-dir ...",
							},
						},
					},
					Evaluate: model.Evaluate{
						Env:     map[string]string{"result_file1": "result.json"},
						Configs: map[string]string{"cfg.yaml": ""},
						Run: `do-some-fancy-low-code-evaluation-here \
--config-file ... \
--output-dir ... \
--input-files ${AUTOPILOT_RESULT_FILES}`,
					},
				},
			},
		},
		ManualChecks: []model.ManualCheck{
			{
				Item: model.Item{
					Chapter:     configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"},
					Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"},
					Check:       configuration.Check{Id: "3", Title: "check 3"},
				},
				Manual: configuration.Manual{Status: "YELLOW", Reason: "It should be YELLOW"},
			},
		},
		Finalize: &model.Finalize{
			Env:     map[string]string{"VAR_2": "finalize_var2"},
			Configs: map[string]string{"cfg2.yaml": ""},
			Run:     `echo "$VAR_1"`,
		},
	}
}

func simpleManualChapter() *Chapter {
	return &Chapter{
		Title:  "chapter1",
		Text:   "my chapter",
		Status: "GREEN",
		Requirements: map[string]*Requirement{
			"1": {
				Title:  "requirement1",
				Text:   "my requirement",
				Status: "GREEN",
				Checks: map[string]*Check{
					"1": {
						Title: "check1",
						Type:  "manual",
						Evaluation: Evaluation{
							Status: "GREEN",
							Reason: "It should be GREEN",
						},
					},
				},
			},
		},
	}
}

func simpleAutomationChapter() *Chapter {
	return &Chapter{
		Title:  "chapter",
		Text:   "my chapter",
		Status: "GREEN",
		Requirements: map[string]*Requirement{
			"1": {
				Title:  "requirement1",
				Text:   "my requirement",
				Status: "GREEN",
				Checks: map[string]*Check{
					"1": {
						Title: "check1",
						Type:  "automation",
						Autopilots: []Autopilot{
							{
								Name: "pdf-checker",
								Steps: []Step{
									{
										Title: "fetch1",
										Id:    "fetch1",
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
										ConfigFiles: []string{"cfg.yaml"},
										OutputDir:   "fetch1/files",
										ResultFile:  "fetch1/data.json",
										ExitCode:    0,
									},
									{
										Title:      "fetch2",
										Id:         "fetch2",
										Logs:       []string{"{\"source\":\"stdout\",\"text\":\"log1\"}"},
										OutputDir:  "fetch2/files",
										ResultFile: "fetch2/data.json",
										ExitCode:   0,
									},
									{
										Title:      "transform",
										Id:         "transform",
										Logs:       []string{"{\"source\":\"stdout\",\"text\":\"log1\"}"},
										Depends:    []string{"fetch1", "fetch2"},
										InputDirs:  []string{"fetch1", "fetch2"},
										OutputDir:  "transform/files",
										ResultFile: "transform/data.json",
										ExitCode:   0,
									},
								},
							},
						},
						Evaluation: Evaluation{
							Status:      "GREEN",
							Reason:      "should be GREEN",
							ConfigFiles: []string{"cfg.yaml"},
							Results: []EvaluationResult{
								{
									Criterion:     "criterion",
									Fulfilled:     true,
									Justification: "justified",
									Metadata:      nil,
								},
							},
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
							Messages: []string{"this is a message"},
							ExitCode: 0,
						},
					},
				},
			},
		},
	}
}
