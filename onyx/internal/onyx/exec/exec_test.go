//go:build unit
// +build unit

package exec

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/B-S-F/onyx/internal/onyx/common"
	"github.com/B-S-F/onyx/pkg/configuration"
	v1 "github.com/B-S-F/onyx/pkg/configuration/versions/v1"
	"github.com/B-S-F/onyx/pkg/finalize"
	"github.com/B-S-F/onyx/pkg/item"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/result"
	resultv1 "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/B-S-F/onyx/pkg/transformer"
	"github.com/B-S-F/onyx/pkg/v2/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	yaml "gopkg.in/yaml.v3"
)

type mockSchema struct {
	mock.Mock
}

func (s *mockSchema) Load(config interface{}) error {
	args := s.Called(config)
	return args.Error(0)
}

func (s *mockSchema) JSON() []byte {
	args := s.Called()
	return args.Get(0).([]byte)
}

func (s *mockSchema) Validate(content []byte) error {
	args := s.Called(content)
	return args.Error(0)
}

var configContent = `
metadata:
  version: v1
autopilots:
  autopilot1:
    run: echo "Hello Autopilot 1!"
chapters: 
  '1':
    title: chapter 1
    requirements:
      '1':
        title: requirement 1
        text: requirement text 1
        checks:
          '1':
            title: check 1
            automation:
              autopilot: autopilot1
              config:
                - config1.yaml
          '2':
            title: check 2
            manual:
              status: UNANSWERED
              reason: Not answered yet
          '3':
            title: check 3
            automation:
              autopilot: autopilot1
              config:
                - config1.yaml
`

var configContentWithFinalizer = configContent + `
finalize:
  run: |
    echo "Hello World!"
`

func TestInitPlan(t *testing.T) {
	cases := []struct {
		config           string
		containsFinalize bool
	}{
		{
			config:           configContent,
			containsFinalize: false,
		},
		{
			config:           configContentWithFinalizer,
			containsFinalize: true,
		},
	}

	for _, tc := range cases {
		tmpDir := t.TempDir()
		configContent := strings.TrimSpace(tc.config)
		schema := &mockSchema{}
		timeout := 10 * time.Minute
		schema.On("Load", mock.Anything).Return(nil)
		schema.On("Validate", mock.Anything).Return(nil)
		e := &exec{
			schema:          schema,
			configCreator:   &common.ConfigCreatorImpl{},
			resultEngine:    result.NewDefaultEngine(tmpDir),
			itemEngine:      item.NewEngine(tmpDir, false, timeout),
			finalizerEngine: finalize.NewEngine(tmpDir, timeout),
			logger:          logger.Get(),
			execParams: parameter.ExecutionParameter{
				Strict: false,
			},
		}

		var cfg *v1.Config
		err := yaml.Unmarshal([]byte(configContent), &cfg)
		require.NoError(t, err)

		ep, err := e.initPlanV1(cfg, map[string]string{}, map[string]string{})
		assert.NoError(t, err)
		assert.NotNil(t, ep)

		err = e.executePlan(ep, map[string]string{}, map[string]string{})
		assert.NoError(t, err)
		assert.NotNil(t, e.resultEngine.GetResult())

		err = e.executeFinalizer(ep, nil)
		assert.NoError(t, err)
		assert.NotNil(t, e.resultEngine.GetResult())

		foundFinalize := e.resultEngine.GetResult().Finalize != nil
		assert.Equal(t, tc.containsFinalize, foundFinalize)
	}
}

func TestNoSkipOnEmptyCheckIdentifier(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := strings.TrimSpace(configContent)
	schema := &mockSchema{}
	schema.On("Load", mock.Anything).Return(nil)
	schema.On("Validate", mock.Anything).Return(nil)
	execParams := parameter.ExecutionParameter{
		Strict:          false,
		CheckIdentifier: "",
		CheckTimeout:    10 * time.Minute,
	}
	transformer := []transformer.Transformer{
		transformer.NewAutopilotSkipper(execParams),
		transformer.NewConfigsLoader(ROOT_WORK_DIRECTORY),
	}
	e := &exec{
		schema:          schema,
		configCreator:   &common.ConfigCreatorImpl{},
		resultEngine:    result.NewDefaultEngine(tmpDir),
		itemEngine:      item.NewEngine(tmpDir, false, execParams.CheckTimeout),
		finalizerEngine: finalize.NewEngine(tmpDir, execParams.CheckTimeout),
		transformer:     transformer,
		logger:          logger.Get(),
		execParams:      execParams,
	}

	var cfg *v1.Config
	err := yaml.Unmarshal([]byte(configContent), &cfg)
	require.NoError(t, err)

	ep, err := e.initPlanV1(cfg, map[string]string{}, map[string]string{})
	assert.NoError(t, err)
	assert.Equal(t, 3, len(ep.Items))
	for _, item := range ep.Items {
		assert.NotEqual(t, "SKIPPED", item.Manual.Status)
	}
}

func TestInitPlanSingleCheck(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := strings.TrimSpace(configContent)
	schema := &mockSchema{}
	schema.On("Load", mock.Anything).Return(nil)
	schema.On("Validate", mock.Anything).Return(nil)
	execParams := parameter.ExecutionParameter{
		Strict:          false,
		CheckIdentifier: "1_1_1",
		CheckTimeout:    10 * time.Minute,
	}
	transformer := []transformer.Transformer{
		transformer.NewAutopilotSkipper(execParams),
		transformer.NewConfigsLoader(ROOT_WORK_DIRECTORY),
	}
	e := &exec{
		schema:          schema,
		configCreator:   &common.ConfigCreatorImpl{},
		resultEngine:    result.NewDefaultEngine(tmpDir),
		itemEngine:      item.NewEngine(tmpDir, false, execParams.CheckTimeout),
		finalizerEngine: finalize.NewEngine(tmpDir, execParams.CheckTimeout),
		transformer:     transformer,
		logger:          logger.Get(),
		execParams:      execParams,
	}

	getCheck := func(items []configuration.Item, check string) *configuration.Item {
		for _, item := range items {
			if item.Check.Id == check {
				return &item
			}
		}
		return nil
	}

	var cfg *v1.Config
	err := yaml.Unmarshal([]byte(configContent), &cfg)
	require.NoError(t, err)

	ep, err := e.initPlanV1(cfg, map[string]string{}, map[string]string{})
	assert.NoError(t, err)
	assert.Equal(t, 3, len(ep.Items))
	assert.Equal(t, "SKIPPED", getCheck(ep.Items, "3").Manual.Status)
	assert.Equal(t, "UNANSWERED", getCheck(ep.Items, "2").Manual.Status)
	assert.Equal(t, configuration.Manual{}, getCheck(ep.Items, "1").Manual)
	assert.Equal(t, "", ep.Finalize.Autopilot.Run)
}

func TestInitPlanSingleCheckIsManual(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := strings.TrimSpace(configContent)
	schema := &mockSchema{}
	schema.On("Load", mock.Anything).Return(nil)
	schema.On("Validate", mock.Anything).Return(nil)
	execParams := parameter.ExecutionParameter{
		Strict:          false,
		CheckIdentifier: "1_1_2",
		CheckTimeout:    10 * time.Minute,
	}
	transformer := []transformer.Transformer{
		transformer.NewAutopilotSkipper(execParams),
		transformer.NewConfigsLoader(ROOT_WORK_DIRECTORY),
	}
	e := &exec{
		schema:          schema,
		configCreator:   &common.ConfigCreatorImpl{},
		resultEngine:    result.NewDefaultEngine(tmpDir),
		itemEngine:      item.NewEngine(tmpDir, false, execParams.CheckTimeout),
		finalizerEngine: finalize.NewEngine(tmpDir, execParams.CheckTimeout),
		transformer:     transformer,
		logger:          logger.Get(),
		execParams:      execParams,
	}

	var cfg *v1.Config
	err := yaml.Unmarshal([]byte(configContent), &cfg)
	require.NoError(t, err)

	_, err = e.initPlanV1(cfg, map[string]string{}, map[string]string{})
	assert.Error(t, err)
}

func TestAllAppReferences(t *testing.T) {
	app1RepoTest := configuration.AppReference{
		Name:       "app1",
		Version:    "1.0.0",
		Repository: "test",
	}
	app2NoRepo := configuration.AppReference{
		Name:    "app2",
		Version: "1.0.0",
	}
	app1NoRepo := configuration.AppReference{
		Name:    "app1",
		Version: "1.0.0",
	}
	executionPlan := &configuration.ExecutionPlan{
		Items: []configuration.Item{
			{
				Chapter: configuration.Chapter{
					Id: "1",
				},
				Requirement: configuration.Requirement{
					Id: "1",
				},
				Check: configuration.Check{
					Id: "1",
				},
				AppReferences: []*configuration.AppReference{
					&app1RepoTest,
					&app2NoRepo,
				},
			},
			{
				Chapter: configuration.Chapter{
					Id: "1",
				},
				Requirement: configuration.Requirement{
					Id: "1",
				},
				Check: configuration.Check{
					Id: "3",
				},
				AppReferences: []*configuration.AppReference{
					&app1NoRepo,
				},
			},
		},
	}

	appReferences := allAppReferences(executionPlan)

	assert.Equal(t, 3, len(appReferences))
	assert.Equal(t, app1RepoTest.Name, appReferences[0].Name)
	assert.Equal(t, app1RepoTest.Version, appReferences[0].Version)
	assert.Equal(t, app1RepoTest.Repository, appReferences[0].Repository)

	assert.Equal(t, app2NoRepo.Name, appReferences[1].Name)
	assert.Equal(t, app2NoRepo.Version, appReferences[1].Version)
	assert.Equal(t, app2NoRepo.Repository, appReferences[1].Repository)

	assert.Equal(t, app1NoRepo.Name, appReferences[2].Name)
	assert.Equal(t, app1NoRepo.Version, appReferences[2].Version)
	assert.Equal(t, app1NoRepo.Repository, appReferences[2].Repository)
}

func TestStoreResultFile(t *testing.T) {
	resultData := &resultv1.Result{
		Metadata: resultv1.Metadata{
			Version: "v1",
		},
		Chapters: map[string]*resultv1.Chapter{
			"1": {
				Title:  "chapter 1",
				Status: "GREEN",
				Requirements: map[string]*resultv1.Requirement{
					"1": {
						Title:  "requirement 1",
						Status: "GREEN",
						Checks: map[string]*resultv1.Check{
							"1": {
								Title:  "check 1",
								Status: "GREEN",
								Type:   "autopilot",
								Evaluation: resultv1.CheckResult{
									Status: "GREEN",
									Reason: "This is my reason",
									Results: []resultv1.AutopilotResult{
										{
											Criterion:     "This is my criterion",
											Fulfilled:     true,
											Justification: "  Line 1\n  Line 2\nLine 3",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	schema := &mockSchema{}
	schema.On("Load", mock.Anything).Return(nil)
	schema.On("Validate", mock.Anything).Return(nil)

	tmpDir := t.TempDir()
	timeout := 10 * time.Minute
	e := &exec{
		schema:          schema,
		configCreator:   &common.ConfigCreatorImpl{},
		resultEngine:    result.NewDefaultEngine(tmpDir),
		itemEngine:      item.NewEngine(tmpDir, false, timeout),
		finalizerEngine: finalize.NewEngine(tmpDir, timeout),
		logger:          logger.Get(),
	}

	err := e.storeResultFile(resultData, filepath.Join(tmpDir, "qg-result.json"))
	assert.NoError(t, err)
	_, err = os.Stat(filepath.Join(tmpDir, "qg-result.json"))
	assert.NoError(t, err)
}

func TestExecErrors(t *testing.T) {
	tests := map[string]struct {
		execParams parameter.ExecutionParameter
		want       error
		prep       func(t *testing.T, inputDir string)
	}{
		"should_return_error_when_custom_validation_fails": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("custom config validation failed: invalid step id invalÜdID: ID contains invalid characters. Only alphanumeric characters, dashes, and underscores are allowed."),
			prep: func(t *testing.T, inputDir string) {
				qgFile := filepath.Join(inputDir, "qg-config.yaml")

				cfg := simpleConfigV2()
				a := cfg.Autopilots["checker"]
				a.Steps = []config.Step{{ID: "invalÜdID"}}
				cfg.Autopilots["checker"] = a

				cfgContent, err := yaml.Marshal(cfg)
				require.NoError(t, err)

				err = os.WriteFile(qgFile, cfgContent, 0644)
				require.NoError(t, err)

				varsFile := filepath.Join(inputDir, ".vars")
				err = os.WriteFile(varsFile, nil, 0644)
				require.NoError(t, err)

				secretsFile := filepath.Join(inputDir, ".secrets")
				err = os.WriteFile(secretsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
		"should_return_error_when_schema_validation_fail": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("error validating schema: config data does not match schema"),
			prep: func(t *testing.T, inputDir string) {
				qgFile := filepath.Join(inputDir, "qg-config.yaml")

				cfgWithoutChapters := `metadata:
    version: v1
header:
    name: testV1
    version: "1.0"`

				err := os.WriteFile(qgFile, []byte(cfgWithoutChapters), 0644)
				require.NoError(t, err)

				varsFile := filepath.Join(inputDir, ".vars")
				err = os.WriteFile(varsFile, nil, 0644)
				require.NoError(t, err)

				secretsFile := filepath.Join(inputDir, ".secrets")
				err = os.WriteFile(secretsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
		"should_return_error_when_unsupported_config_version": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("error creating config: version v1337 not supported"),
			prep: func(t *testing.T, inputDir string) {
				qgFile := filepath.Join(inputDir, "qg-config.yaml")

				cfg := simpleConfigV2()
				cfg.Metadata.Version = "v1337"
				cfgContent, err := yaml.Marshal(cfg)
				require.NoError(t, err)

				err = os.WriteFile(qgFile, cfgContent, 0644)
				require.NoError(t, err)

				varsFile := filepath.Join(inputDir, ".vars")
				err = os.WriteFile(varsFile, nil, 0644)
				require.NoError(t, err)

				secretsFile := filepath.Join(inputDir, ".secrets")
				err = os.WriteFile(secretsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
		"should_return_error_when_config_file_does_not_exist": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("error reading file"),
			prep: func(t *testing.T, inputDir string) {
				varsFile := filepath.Join(inputDir, ".vars")
				err := os.WriteFile(varsFile, nil, 0644)
				require.NoError(t, err)

				secretsFile := filepath.Join(inputDir, ".secrets")
				err = os.WriteFile(secretsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
		"should_return_error_when_vars_file_does_not_exist": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("error reading file"),
			prep: func(t *testing.T, inputDir string) {
				cfg := simpleConfigV2()
				cfgContent, err := yaml.Marshal(cfg)
				require.NoError(t, err)

				qgFile := filepath.Join(inputDir, "qg-config.yaml")
				err = os.WriteFile(qgFile, cfgContent, 0644)
				require.NoError(t, err)

				secretsFile := filepath.Join(inputDir, ".secrets")
				err = os.WriteFile(secretsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
		"should_return_error_when_secrets_file_does_not_exist": {
			execParams: parameter.ExecutionParameter{
				ConfigName:  "qg-config.yaml",
				VarsName:    ".vars",
				SecretsName: ".secrets",
			},
			want: errors.New("error reading file"),
			prep: func(t *testing.T, inputDir string) {
				cfg := simpleConfigV2()
				cfgContent, err := yaml.Marshal(cfg)
				require.NoError(t, err)

				qgFile := filepath.Join(inputDir, "qg-config.yaml")
				err = os.WriteFile(qgFile, cfgContent, 0644)
				require.NoError(t, err)

				varsFile := filepath.Join(inputDir, ".vars")
				err = os.WriteFile(varsFile, nil, 0644)
				require.NoError(t, err)
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			// cleanup onyx root dirs
			defer func(t *testing.T) {
				matches, err := filepath.Glob(filepath.Join("/tmp", "onyx-*"))
				require.NoError(t, err)

				for _, m := range matches {
					info, err := os.Stat(m)
					require.NoError(t, err)

					if info.IsDir() {
						err = os.RemoveAll(m)
						require.NoError(t, err)
					}
				}
			}(t)

			// t.TempDir default input dir
			if tt.execParams.InputFolder == "" {
				tt.execParams.InputFolder = t.TempDir()
			}

			tt.prep(t, tt.execParams.InputFolder)

			err := Exec(tt.execParams)
			require.Equal(t, err != nil, tt.want != nil)
			if tt.want != nil {
				require.ErrorContains(t, err, tt.want.Error())
			}
		})
	}
}

func TestExecBackwardsCompatibilityQGConfigV1(t *testing.T) {
	tmpDir := t.TempDir()
	cfgFilepath := filepath.Join(tmpDir, "qg-config-v1.yaml")

	cfg, err := yaml.Marshal(simpleConfigV1())
	require.NoError(t, err)

	err = os.WriteFile(cfgFilepath, cfg, 0644)
	require.NoError(t, err)

	varsFilepath := filepath.Join(tmpDir, ".vars")
	err = os.WriteFile(varsFilepath, nil, 0644)
	require.NoError(t, err)

	secretsFilepath := filepath.Join(tmpDir, ".secrets")
	err = os.WriteFile(secretsFilepath, nil, 0644)
	require.NoError(t, err)

	execParams := parameter.ExecutionParameter{
		ConfigName:   "qg-config-v1.yaml",
		InputFolder:  tmpDir,
		VarsName:     ".vars",
		SecretsName:  ".secrets",
		OutputFolder: tmpDir,
		CheckTimeout: 10 * 60 * time.Second,
	}

	err = Exec(execParams)
	assert.NoError(t, err)

	// qg-result.yaml file should exist
	_, err = os.Stat(filepath.Join(tmpDir, "qg-result.yaml"))
	assert.NoError(t, err)

	// evidence.zip should exist
	_, err = os.Stat(filepath.Join(tmpDir, "evidence.zip"))
	assert.NoError(t, err)

	resFile, err := os.ReadFile(filepath.Join(tmpDir, "qg-result.yaml"))
	assert.NoError(t, err)

	var result resultv1.Result
	err = yaml.Unmarshal(resFile, &result)
	assert.NoError(t, err)

	// assert result file content
	assert.Equal(t, result.Metadata.Version, "v1")
	assert.Equal(t, result.Header.Name, "testV1")
	assert.NotEmpty(t, result.Header.Date)
	assert.Empty(t, result.Header.ToolVersion)
	assert.Equal(t, result.OverallStatus, "GREEN")
	assert.EqualValues(t, result.Statistics.CountChecks, 1)
	assert.EqualValues(t, result.Statistics.CountAutomatedChecks, 1)
	assert.EqualValues(t, result.Statistics.CountManualChecks, 0)
	assert.EqualValues(t, result.Statistics.CountUnansweredChecks, 0)
	assert.EqualValues(t, result.Statistics.CountSkippedChecks, 0)
	assert.EqualValues(t, result.Statistics.PercentageAutomated, 100)
	assert.EqualValues(t, result.Statistics.PercentageDone, 100)
	assert.Len(t, result.Chapters, 1)
	assert.Equal(t, result.Chapters["1"].Title, "chapter1")
	assert.Equal(t, result.Chapters["1"].Text, "")
	assert.Equal(t, result.Chapters["1"].Status, "GREEN")
	assert.Len(t, result.Chapters["1"].Requirements, 1)
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Title, "requirement1")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Text, "")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Status, "GREEN")
	assert.Len(t, result.Chapters["1"].Requirements["1"].Checks, 1)
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Title, "check1")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Status, "GREEN")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Type, "Automation")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Autopilot, "checker")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Status, "GREEN")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Reason, "This is a reason")
	assert.Len(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Results, 1)
	assert.EqualValues(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Results[0].Criterion, "I am a criterion")
	assert.EqualValues(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Results[0].Justification, "I am the justification")
	assert.True(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Results[0].Fulfilled)
	assert.Nil(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Results[0].Metadata)
	assert.Len(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Outputs, 2)
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Outputs["output1"], "out1")
	assert.Equal(t, result.Chapters["1"].Requirements["1"].Checks["1"].Evaluation.Outputs["output2"], "out2")
}

func TestExecQGConfigV2(t *testing.T) {
	// TODO
	t.Skip("execution of qg-config v2 needs to be implemented")

	tmpDir := t.TempDir()
	cfgFilepath := filepath.Join(tmpDir, "qg-config-v2.yaml")

	cfg, err := yaml.Marshal(simpleConfigV2())
	require.NoError(t, err)

	err = os.WriteFile(cfgFilepath, cfg, 0644)
	require.NoError(t, err)

	varsFilepath := filepath.Join(tmpDir, ".vars")
	err = os.WriteFile(varsFilepath, nil, 0644)
	require.NoError(t, err)

	secretsFilepath := filepath.Join(tmpDir, ".secrets")
	err = os.WriteFile(secretsFilepath, nil, 0644)
	require.NoError(t, err)

	execParams := parameter.ExecutionParameter{
		ConfigName:  "qg-config-v2.yaml",
		InputFolder: tmpDir,
		VarsName:    ".vars",
		SecretsName: ".secrets",
	}

	err = Exec(execParams)
	assert.NoError(t, err)

	// TODO: assert result
}

func simpleResultV1() *resultv1.Result {
	return &resultv1.Result{
		Metadata: resultv1.Metadata{Version: "v1"},
		Header:   resultv1.Header{Name: "testv1", Version: "1.0"},
	}
}

func simpleConfigV1() *v1.Config {
	return &v1.Config{
		Metadata: v1.Metadata{Version: "v1"},
		Header:   v1.Header{Name: "testV1", Version: "1.0"},
		Autopilots: map[string]v1.Autopilot{
			"checker": {
				Run: `echo '{"output": {"output1": "out1"}}'
echo '{"output": {"output2": "out2"}}'
echo '{"status": "GREEN", "reason": "This is a reason"}'
echo '{"result": {"criterion": "I am a criterion", "fulfilled": true, "justification": "I am the justification"}}'`,
			},
		},
		Chapters: map[string]v1.Chapter{
			"1": {
				Title: "chapter1",
				Requirements: map[string]v1.Requirement{
					"1": {
						Title: "requirement1",
						Checks: map[string]v1.Check{
							"1": {
								Title:      "check1",
								Automation: v1.Automation{Autopilot: "checker"},
							},
						},
					},
				},
			},
		},
	}
}

func simpleConfigV2() *config.Config {
	return &config.Config{
		Metadata: config.Metadata{Version: "v2"},
		Header:   config.Header{Name: "test", Version: "1.0"},
		Autopilots: map[string]config.Autopilot{
			"checker": {
				Evaluate: config.Evaluate{
					Run: `|
echo '{"status": "GREEN"}'
echo '{"reason": "Some reason"}'
echo '{"result": {"criterion": "I am a criterion", "fulfilled": false, "justification": "I am the justification"}}'`,
				},
			},
		},
		Chapters: map[string]config.Chapter{
			"1": {
				Title: "chapter1",
				Text:  "my chapter",
				Requirements: map[string]config.Requirement{
					"1": {
						Title: "requirement1",
						Text:  "my requirement",
						Checks: map[string]config.Check{
							"1": {
								Title:      "check 1",
								Automation: &config.Automation{Autopilot: "checker"},
							},
							"2": {
								Title:      "check 2",
								Automation: &config.Automation{Autopilot: "checker"},
							},
							"3": {
								Title: "check 3",
								Manual: &config.Manual{
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
