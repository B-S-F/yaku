package config

import (
	"fmt"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	model "github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfig_CreateExecutionPlan(t *testing.T) {
	type want struct {
		execPlan func() *model.ExecutionPlan
		err      error
	}
	tests := map[string]struct {
		input func() *Config
		want  want
	}{
		"should-create-execPlan": {
			input: func() *Config { return simpleConfig() },
			want:  want{execPlan: func() *model.ExecutionPlan { return simpleExecPlan() }},
		},
		"should-create-execPlan-when-finalize-is-nil": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Finalize = nil
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.Finalize = nil
				return ep
			}},
		},
		"should-create-execPlan-when-finalize-config-is-nil": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Finalize.Config = nil
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.Finalize.Configs = nil
				return ep
			}},
		},

		"should-create-execPlan-when-repositories-is-nil": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Repositories = nil
				cfg.Autopilots = nil
				cfg.Chapters["1"] = Chapter{Title: "chapter1", Text: "my chapter1", Requirements: map[string]Requirement{
					"1": {Title: "requirement1", Text: "my requirement1", Checks: map[string]Check{"1": {Title: "check 1", Manual: &Manual{Status: "GREEN", Reason: "ALWAYS GREEN"}}}},
				}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.Repositories = nil
				ep.ManualChecks = []model.ManualCheck{
					{Item: model.Item{
						Chapter:     configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter1"},
						Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement1"},
						Check:       configuration.Check{Id: "1", Title: "check 1"},
					},
						Manual: configuration.Manual{Status: "GREEN", Reason: "ALWAYS GREEN"},
					}}
				ep.AutopilotChecks = nil
				return ep
			}},
		},
		"should-create-execPlan-when-repository.Config-with-nil-value": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Repositories[0].Config["test"] = nil
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.Repositories[0].Config["test"] = nil
				return ep
			}},
		},
		"should-create-execPlan-when-default-vars-is-nil": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Default = Default{Vars: nil}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.DefaultVars = nil
				return ep
			}},
		},
		"should-create-execPlan-when-env-is-nil": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Env = nil
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.Env = nil
				return ep
			}},
		},
		"should-create-execPlan-with-unique-repositories-when-duplicates-provided": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Repositories = append(cfg.Repositories, Repository{Name: "github", Type: "curl", Config: map[string]interface{}{"url": "github.com"}})
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan { return simpleExecPlan() }},
		},
		"should-create-execPlan-with-multiple-chapters-and-requirements": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Chapters["2"] = Chapter{Title: "chapter2", Text: "my chapter2", Requirements: map[string]Requirement{
					"1": {Title: "requirement1", Text: "my requirement1", Checks: map[string]Check{"1": {Title: "check 1", Manual: &Manual{Status: "GREEN", Reason: "ALWAYS GREEN"}}}},
					"2": {Title: "requirement2", Text: "my requirement2", Checks: map[string]Check{"1": {Title: "check 1", Manual: &Manual{Status: "YELLOW", Reason: "ALWAYS YELLOW"}}}},
				}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.ManualChecks = append(ep.ManualChecks,
					model.ManualCheck{
						Item:   model.Item{Chapter: configuration.Chapter{Id: "2", Title: "chapter2", Text: "my chapter2"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement1"}, Check: configuration.Check{Id: "1", Title: "check 1"}},
						Manual: configuration.Manual{Status: "GREEN", Reason: "ALWAYS GREEN"}},
					model.ManualCheck{
						Item:   model.Item{Chapter: configuration.Chapter{Id: "2", Title: "chapter2", Text: "my chapter2"}, Requirement: configuration.Requirement{Id: "2", Title: "requirement2", Text: "my requirement2"}, Check: configuration.Check{Id: "1", Title: "check 1"}},
						Manual: configuration.Manual{Status: "YELLOW", Reason: "ALWAYS YELLOW"}},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-autopilot-item-step-with-sanitized-title-as-unique-id-when-id-was-not-defined": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Steps: []Step{{Title: "übe$r @title1!"}}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:      model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot: model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}, Steps: [][]model.Step{{model.Step{Title: "übe$r @title1!", ID: "uebertitle1"}}}},
					})
				return ep
			}},
		},
		"should-create-execPlan-with-autopilot-item-step-with-title-plus-suffix-as-unique-id-when-id-was-not-present-and-title-was-not-unique": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Steps: []Step{{Title: "title1"}, {Title: "title1"}}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:      model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot: model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}, Steps: [][]model.Step{{{Title: "title1", ID: "title1"}, {Title: "title1", ID: "title1_1"}}}},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-autopilot-item-step-with-step-index-as-unique-id-when-no-title-or-id-was-defined": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Steps: []Step{{Run: "echo hello"}}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:      model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot: model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}, Steps: [][]model.Step{{{ID: "step-1", Run: "echo hello"}}}},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-autopilot-item-step-with-step-index-plus-suffix-as-unique-id-when-no-title-or-id-was-defined-and-step-index-was-not-unique": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Steps: []Step{{Title: "title", ID: "step-2"}, {Run: "echo hello"}}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:      model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot: model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}, Steps: [][]model.Step{{{Title: "title", ID: "step-2"}, {ID: "step-2_1", Run: "echo hello"}}}},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-invalid-autopilot-item-when-referenced-autopilot-was-not-defined": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "unknown"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:           model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot:      model.Autopilot{Name: "unknown"},
						ValidationErrs: []error{errors.New("referenced autopilot 'unknown' in check '4' under requirement '1' of chapter '1' was not found in defined autopilots in config")},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-invalid-autopilot-item-when-app-reference-is-invalid-but-process-all-apps": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Apps: []string{"::invalid@@@?", "github::sharepoint-fetcher@1.0.0"}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:           model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot:      model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}},
						AppReferences:  []*configuration.AppReference{{Repository: "github", Name: "sharepoint-fetcher", Version: "1.0.0"}},
						ValidationErrs: []error{errors.New("app reference '::invalid@@@?' is invalid: error creating app reference: app name contains reserved characters [@ @ @ ?]")},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-invalid-autopilot-item-when-app-reference-has-unknown-repository-but-process-all-apps": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Apps: []string{"unknown-repo::sharepoint-fetcher@0.7.0", "github::sharepoint-fetcher@1.0.0"}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:           model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot:      model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}},
						AppReferences:  []*configuration.AppReference{{Repository: "github", Name: "sharepoint-fetcher", Version: "1.0.0"}},
						ValidationErrs: []error{errors.New("repository 'unknown-repo' referenced in app 'unknown-repo::sharepoint-fetcher@0.7.0' was not found")},
					},
				)
				return ep
			}},
		},
		"should-create-execPlan-with-invalid-autopilot-item-when-steps-have-cycle-in-dependencies": {
			input: func() *Config {
				cfg := simpleConfig()
				cfg.Autopilots["downloader"] = Autopilot{Steps: []Step{{ID: "1", Depends: []string{"2"}}, {ID: "2", Depends: []string{"1"}}}, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{execPlan: func() *model.ExecutionPlan {
				ep := simpleExecPlan()
				ep.AutopilotChecks = append(ep.AutopilotChecks,
					model.AutopilotCheck{
						Item:           model.Item{Chapter: configuration.Chapter{Id: "1", Title: "chapter1", Text: "my chapter"}, Requirement: configuration.Requirement{Id: "1", Title: "requirement1", Text: "my requirement"}, Check: configuration.Check{Id: "4", Title: "check4"}},
						Autopilot:      model.Autopilot{Name: "downloader", Evaluate: model.Evaluate{Run: "echo hello world"}},
						ValidationErrs: []error{errors.New("referenced autopilot 'downloader' in check '4' under requirement '1' of chapter '1' has cyclic dependencies inside it's steps")},
					},
				)
				return ep
			}},
		},
		"should-return-error-when-config-is-nil": {
			input: func() *Config { return nil },
			want: want{
				execPlan: func() *model.ExecutionPlan { return nil },
				err:      errors.New("provided config is nil"),
			},
		},
		"should-return-error-when-repository-config-contains-not-allowed-value-type": {
			input: func() *Config {
				type testStruct struct {
					Name string
				}
				cfg := simpleConfig()
				cfg.Repositories[0].Config["test"] = testStruct{Name: "test"}
				return cfg
			},
			want: want{err: errors.New("failed to deep copy 'repository.Config': error copying key test: unsupported type: struct"), execPlan: func() *model.ExecutionPlan { return nil }},
		},
		"should-return-error-when-unable-to-generate-unique-stepID-based-on-title": {
			input: func() *Config {
				cfg := simpleConfig()

				// 10k steps
				steps := []Step{{Title: "title1"}, {ID: "title1"}}
				for i := 0; i < 9999; i++ {
					steps = append(steps, Step{ID: fmt.Sprintf("title1_%d", i)})
				}

				cfg.Autopilots["downloader"] = Autopilot{Steps: steps, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{
				execPlan: func() *model.ExecutionPlan { return nil },
				err:      errors.New("failed to create autopilotCheck: failed to convert 'autopilot.Steps[0]' to domain Step: failed to generate unique ID for step: generated step ID 'title1_9998' is not unique"),
			},
		},
		"should-return-error-when-unable-to-generate-unique-stepID-based-on-step-index": {
			input: func() *Config {
				cfg := simpleConfig()

				// 10k steps
				steps := []Step{{Run: "test"}, {ID: "step-1"}}
				for i := 0; i < 9999; i++ {
					steps = append(steps, Step{ID: fmt.Sprintf("step-1_%d", i)})
				}

				cfg.Autopilots["downloader"] = Autopilot{Steps: steps, Evaluate: Evaluate{Run: "echo hello world"}}
				cfg.Chapters["1"].Requirements["1"].Checks["4"] = Check{Title: "check4", Automation: &Automation{Autopilot: "downloader"}}
				return cfg
			},
			want: want{
				execPlan: func() *model.ExecutionPlan { return nil },
				err:      errors.New("failed to create autopilotCheck: failed to convert 'autopilot.Steps[0]' to domain Step: failed to generate unique ID for step: generated step ID 'step-1_9998' is not unique"),
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := tt.input().CreateExecutionPlan()
			require.Equal(t, (err != nil), tt.want.err != nil)
			if tt.want.err != nil {
				assert.EqualError(t, err, tt.want.err.Error())
			}

			assertExecPlan(t, tt.want.execPlan(), got)
		})
	}
}

func simpleConfig() *Config {
	return &Config{
		Metadata: Metadata{Version: "v2"},
		Header:   Header{Name: "test", Version: "1.0"},
		Default:  Default{Vars: map[string]string{"var1": "value1"}},
		Env:      map[string]string{"env1": "env_value1"},
		Repositories: []Repository{{
			Name: "github",
			Type: "curl",
			Config: map[string]interface{}{
				"url":  "github.com",
				"auth": map[string]string{"type": "basic", "username": "user", "password": "pw"},
			}}},
		Autopilots: map[string]Autopilot{
			"pdf-checker": {
				Apps: []string{"github::sharepoint-fetcher@0.7.0"},
				Env:  map[string]string{"VAR_1": "autopilot_var_1"},
				Steps: []Step{
					{
						Title:  "fetch1",
						ID:     "fetch1",
						Env:    map[string]string{"key": "value"},
						Config: []string{"cfg.yaml"},
						Run:    "sharepoint-fetcher --config-file=..._1.yaml --output-dir=...",
					},
					{
						Title: "fetch2",
						ID:    "fetch2",
						Run:   "sharepoint-fetcher --config-file=..._2.yaml --output-dir=...",
					},
					{
						Title:   "transform",
						Depends: []string{"fetch1", "fetch2"},
						Run:     "pdf-sig-transformer --config-file=... --input-dir ... --input-dir ... --output-dir ...",
					},
				},
				Evaluate: Evaluate{
					Env:    map[string]string{"result_file1": "result.json"},
					Config: []string{"cfg.yaml"},
					Run: `do-some-fancy-low-code-evaluation-here \
--config-file ... \
--output-dir ... \
--input-files ${AUTOPILOT_RESULT_FILES}`,
				},
			},
		},
		Finalize: &Finalize{
			Env:    map[string]string{"VAR_2": "finalize_var2"},
			Config: []string{"cfg2.yaml"},
			Run:    `echo "$VAR_1"`,
		},
		Chapters: map[string]Chapter{
			"1": {
				Title: "chapter1",
				Text:  "my chapter",
				Requirements: map[string]Requirement{
					"1": {
						Title: "requirement1",
						Text:  "my requirement",
						Checks: map[string]Check{
							"1": {
								Title: "check 1",
								Automation: &Automation{
									Autopilot: "pdf-checker",
									Env: map[string]string{
										"SHAREPOINT_URL": "https://sharepoint.com/project1",
									},
								},
							},
							"2": {
								Title:      "check 2",
								Automation: &Automation{Autopilot: "pdf-checker"},
							},
							"3": {
								Title: "check 3",
								Manual: &Manual{
									Status: "YELLOW",
									Reason: "It should be YELLOW",
								},
							},
						},
					},
				},
			},
		},
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

func assertExecPlan(t *testing.T, want, got *model.ExecutionPlan) {
	if want == nil && got == nil {
		return
	}
	assert.Equal(t, want.Metadata, got.Metadata)
	assert.Equal(t, want.Header, got.Header)
	assert.Equal(t, want.DefaultVars, got.DefaultVars)
	assert.Equal(t, want.Env, got.Env)
	assert.Equal(t, want.Repositories, got.Repositories)
	assert.Equal(t, want.Finalize, got.Finalize)

	// assert autopilot checks manually because the order of the steps level of autopilotCheck does matter but the the order of steps inside a step level does not matter
	assert.Equal(t, len(want.AutopilotChecks), len(got.AutopilotChecks))
	for i := 0; i < len(want.AutopilotChecks); i++ {
		assert.True(t, containsAutopilot(want.AutopilotChecks[i], got.AutopilotChecks), "autopilot checks are not equal")
	}

	assert.Equal(t, len(want.ManualChecks), len(got.ManualChecks))
	assert.ElementsMatch(t, want.ManualChecks, got.ManualChecks)
}

func containsAutopilot(autopilot model.AutopilotCheck, list []model.AutopilotCheck) bool {
	for i := 0; i < len(list); i++ {
		if equalAutopilotChecks(autopilot, list[i]) {
			return true
		}
	}
	return false
}

func equalAutopilotChecks(autopilotA, autopilotB model.AutopilotCheck) bool {
	return assert.ObjectsAreEqual(autopilotA.Item, autopilotB.Item) &&
		assert.ObjectsAreEqual(autopilotA.CheckEnv, autopilotB.CheckEnv) &&
		assert.ObjectsAreEqual(autopilotA.AppReferences, autopilotB.AppReferences) &&
		equalErrors(autopilotA.ValidationErrs, autopilotB.ValidationErrs) &&
		assert.ObjectsAreEqual(autopilotA.Autopilot.Env, autopilotB.Autopilot.Env) &&
		assert.ObjectsAreEqual(autopilotA.Autopilot.Evaluate, autopilotB.Autopilot.Evaluate) &&
		assert.ObjectsAreEqual(autopilotA.Autopilot.Name, autopilotB.Autopilot.Name) &&
		assert.ObjectsAreEqual(len(autopilotA.Autopilot.Steps), len(autopilotB.Autopilot.Steps)) &&
		equalSteps(autopilotA.Autopilot.Steps, autopilotB.Autopilot.Steps)
}

func equalErrors(a, b []error) bool {
	if len(a) != len(b) {
		return false
	}

	for i := 0; i < len(a); i++ {
		if a[i].Error() != b[i].Error() {
			return false
		}
	}

	return true
}

func equalSteps(a, b [][]model.Step) bool {
	if len(a) != len(b) {
		return false
	}

	for stepLvl := 0; stepLvl < len(a); stepLvl++ {
		if len(a[stepLvl]) != len(b[stepLvl]) {
			return false
		}

		mapA := make(map[string]model.Step)
		mapB := make(map[string]model.Step)

		for _, stepA := range a[stepLvl] {
			mapA[stepA.ID] = stepA
		}

		for _, stepB := range b[stepLvl] {
			mapB[stepB.ID] = stepB
		}

		if !assert.ObjectsAreEqual(mapA, mapB) {
			return false
		}
	}
	return true
}
