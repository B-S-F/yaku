package v1

import (
	"strconv"
	"strings"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/stretchr/testify/assert"
)

var VALID_CONFIG = Config{
	Metadata: Metadata{
		Version: "v1",
	},
	Header: Header{
		Name:    "Project name",
		Version: "${{ vars.PROJECT_VERSION }}",
	},
	Default: Default{
		Vars: map[string]string{
			"VAR_4": "default_var_1",
		},
	},
	Env: map[string]string{
		"VAR_1": "global_var_1",
		"VAR_2": "global_var_2",
		"VAR_3": "global_var_3",
	},
	Repositories: []AppRepository{
		{
			Name: "repo1",
			Type: "curl",
			Config: map[string]interface{}{
				"url": "https://repo1.com/{name}/{version}",
				"auth": map[string]interface{}{
					"username": "user",
					"password": "pass",
				},
			},
		},
		{
			Name: "repo2",
			Type: "git",
			Config: map[string]interface{}{
				"url": "https://repo2.com/{name}/{version}",
				"auth": map[string]interface{}{
					"token": "token",
				},
			},
		},
	},

	Autopilots: map[string]Autopilot{
		"autopilot1": {
			Run: `echo "$VAR_1"
echo "$VAR_2"
echo "$VAR_3"
echo "Hello Autopilot 1!"
echo '{"status": "GREEN"}'
echo '{"outputs": {"output1": "output1_value", "output2": "output2_value"}}'
echo '{"reason": "This is a reason"}'
echo "BANANAS" > bananas.txt
`,
			Env: map[string]string{
				"VAR_2": "autopilot1_var_2",
			},
			Config: []string{
				"config1.yaml",
			},
		},
		"autopilot2": {
			Run: `echo "$SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME"
echo "Hello Autopilot 2!" > autopilot2.txt
`,
			Env: map[string]string{
				"SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME": "Hello Autopilot 2!",
			},
		},
		"autopilot3": {
			Apps: []string{
				"app1@1.0.0",
				"repo1::app2@1.0.0",
				"repo2::app3@latest",
			},
			Run: `app1
app2@1.0.0
app3@latest
`,
		},
	},
	Finalize: Autopilot{
		Run: `html-finalizer
zip-finalizer
`,
	},
	Chapters: map[string]Chapter{
		"1": {
			Title: "chapter 1",
			Requirements: map[string]Requirement{
				"1": {
					Title: "requirement 1",
					Text:  "requirement text 1",
					Checks: map[string]Check{
						"1": {
							Title: "check 1",
							Automation: Automation{
								Autopilot: "autopilot1",
								Env: map[string]string{
									"VAR_2": "autopilot_ref_var_2",
									"VAR_3": "autopilot_ref_var_3",
								},
								Config: []string{
									"config2.yaml",
								},
							},
						},
						"2": {
							Title: "check 2",
							Automation: Automation{
								Autopilot: "autopilot2",
							},
						},
						"3": {
							Title: "check 3",
							Automation: Automation{
								Autopilot: "autopilot1",
								Env: map[string]string{
									"VAR_2": "check_2_autopilot_ref_var_2",
									"VAR_3": "check_2_autopilot_ref_var_3",
								},
							},
						},
					},
				},
				"2": {
					Title: "requirement 2",
					Text:  "requirement text 2",
					Checks: map[string]Check{
						"4": {
							Title: "check 4",
							Manual: Manual{
								Status: "GREEN",
								Reason: "This is a reason",
							},
						},
					},
				},
				"3": {
					Title: "requirement 3",
					Text:  "requirement text 3",
					Checks: map[string]Check{
						"5": {
							Title: "check 5",
							Manual: Manual{
								Status: "UNANSWERED",
								Reason: "Not answered",
							},
						},
					},
				},
				"4": {
					Title: "requirement 4",
					Text:  "requirement text 4",
					Checks: map[string]Check{
						"6": {
							Title: "check 6",
							Automation: Automation{
								Autopilot: "autopilot3",
							},
						},
					},
				},
			},
		},
	},
}

func TestNew(t *testing.T) {
	config := `metadata:
    version: v1
header:
    name: Project name
    version: ${{ vars.PROJECT_VERSION }}
default:
    vars:
        VAR_4: default_var_1
env: # global env vars
    VAR_1: global_var_1
    VAR_2: global_var_2
    VAR_3: global_var_3
repositories:
    - name: repo1
      type: curl
      configuration:
        url: https://repo1.com/{name}/{version}
        auth:
            username: user
            password: pass
    - name: repo2
      type: git
      configuration:
        url: https://repo2.com/{name}/{version}
        auth:
            token: token

autopilots: 
    autopilot1: 
        run: |
            echo "$VAR_1"
            echo "$VAR_2"
            echo "$VAR_3"
            echo "Hello Autopilot 1!"
            echo '{"status": "GREEN"}'
            echo '{"outputs": {"output1": "output1_value", "output2": "output2_value"}}'
            echo '{"reason": "This is a reason"}'
            echo "BANANAS" > bananas.txt
        config:
            - config1.yaml
        env:
            VAR_2: autopilot1_var_2
    autopilot2:
        run: |
            echo "$SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME"
            echo "Hello Autopilot 2!" > autopilot2.txt
        env:
            SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME: Hello Autopilot 2!
    autopilot3:
        apps:
            - app1@1.0.0
            - repo1::app2@1.0.0
            - repo2::app3@latest
        run: |
            app1
            app2@1.0.0
            app3@latest
finalize:
    run: |
        html-finalizer
        zip-finalizer
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
                            env:
                                VAR_2: autopilot_ref_var_2
                                VAR_3: autopilot_ref_var_3
                            config:
                                - config2.yaml
                    '2':
                        title: check 2
                        automation:
                            autopilot: autopilot2
                    '3':
                        title: check 3
                        automation:
                            autopilot: autopilot1
                            env:
                                VAR_2: check_2_autopilot_ref_var_2
                                VAR_3: check_2_autopilot_ref_var_3
            '2':
                title: requirement 2
                text: requirement text 2
                checks:
                    '4':
                        title: check 4
                        manual:
                            status: GREEN
                            reason: This is a reason
            '3':
                title: requirement 3
                text: requirement text 3
                checks:
                    '5':
                        title: check 5
                        manual:
                            status: UNANSWERED
                            reason: Not answered
            '4':
                title: requirement 4
                text: requirement text 4
                checks:
                    '6':
                        title: check 6
                        automation:
                            autopilot: autopilot3
`

	config = strings.ReplaceAll(config, "\t", "  ")
	cases := []struct {
		name             string
		content          string
		expectedConfig   *Config
		expectedErrorMsg string
	}{
		{
			name:             "should return correct config",
			content:          config,
			expectedConfig:   &VALID_CONFIG,
			expectedErrorMsg: "",
		},
		{
			name:             "should return error if config is invalid",
			content:          `invalid...`,
			expectedConfig:   nil,
			expectedErrorMsg: "line 1: cannot unmarshal !!str `invalid...` into v1.Config",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			config, err := New([]byte(tc.content))
			if tc.expectedErrorMsg != "" {
				assert.ErrorContains(t, err, tc.expectedErrorMsg)
				assert.Equal(t, &Config{}, config)
			} else {
				assert.Equal(t, tc.expectedConfig, config)
				assert.Nil(t, err)
			}
		})
	}

}

func TestParse(t *testing.T) {
	config := VALID_CONFIG
	defaultVars := map[string]string{
		"VAR_4": "default_var_1",
	}
	globalEnv := map[string]string{
		"VAR_1": "global_var_1",
		"VAR_2": "global_var_2",
		"VAR_3": "global_var_3",
	}

	finalize := configuration.Item{
		Autopilot: configuration.Autopilot{
			Name: "finalizer",
			Run: `html-finalizer
zip-finalizer
`,
		},
	}

	items := []configuration.Item{
		{
			Chapter: configuration.Chapter{
				Id:    "1",
				Title: "chapter 1",
				Text:  "",
			},
			Requirement: configuration.Requirement{
				Id:    "2",
				Title: "requirement 2",
				Text:  "requirement text 2",
			},
			Check: configuration.Check{
				Id:    "4",
				Title: "check 4",
			},
			Manual: configuration.Manual{
				Status: "GREEN",
				Reason: "This is a reason",
			},
		},
		{
			Chapter: configuration.Chapter{
				Id:    "1",
				Title: "chapter 1",
				Text:  "",
			},
			Requirement: configuration.Requirement{
				Id:    "3",
				Title: "requirement 3",
				Text:  "requirement text 3",
			},
			Check: configuration.Check{
				Id:    "5",
				Title: "check 5",
			},
			Manual: configuration.Manual{
				Status: "UNANSWERED",
				Reason: "Not answered",
			},
		},
		{
			Env: map[string]string{
				"VAR_2": "autopilot_ref_var_2",
				"VAR_3": "autopilot_ref_var_3",
			},
			Chapter: configuration.Chapter{
				Title: "chapter 1",
				Id:    "1",
			},
			Requirement: configuration.Requirement{
				Title: "requirement 1",
				Text:  "requirement text 1",
				Id:    "1",
			},
			Check: configuration.Check{
				Id:    "1",
				Title: "check 1",
			},
			Config: map[string]string{
				"config1.yaml": "",
				"config2.yaml": "",
			},
			Autopilot: configuration.Autopilot{
				Name: "autopilot1",
				Run: `echo "$VAR_1"
echo "$VAR_2"
echo "$VAR_3"
echo "Hello Autopilot 1!"
echo '{"status": "GREEN"}'
echo '{"outputs": {"output1": "output1_value", "output2": "output2_value"}}'
echo '{"reason": "This is a reason"}'
echo "BANANAS" > bananas.txt
`,
				Env: map[string]string{
					"VAR_2": "autopilot1_var_2",
				},
			},
		},
		{
			Chapter: configuration.Chapter{
				Title: "chapter 1",
				Id:    "1",
			},
			Requirement: configuration.Requirement{
				Title: "requirement 1",
				Text:  "requirement text 1",
				Id:    "1",
			},
			Check: configuration.Check{
				Id:    "2",
				Title: "check 2",
			},
			Config: map[string]string{},
			Autopilot: configuration.Autopilot{
				Name: "autopilot2",
				Run: `echo "$SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME"
echo "Hello Autopilot 2!" > autopilot2.txt
`,
				Env: map[string]string{
					"SOME_APP_NEEDS_A_SPECIAL_ENV_VAR_NAME": "Hello Autopilot 2!",
				},
			},
		},
		{
			Env: map[string]string{
				"VAR_2": "check_2_autopilot_ref_var_2",
				"VAR_3": "check_2_autopilot_ref_var_3",
			},
			Chapter: configuration.Chapter{
				Title: "chapter 1",
				Id:    "1",
			},
			Requirement: configuration.Requirement{
				Title: "requirement 1",
				Text:  "requirement text 1",
				Id:    "1",
			},
			Check: configuration.Check{
				Id:    "3",
				Title: "check 3",
			},
			Config: map[string]string{
				"config1.yaml": "",
			},
			Autopilot: configuration.Autopilot{
				Name: "autopilot1",
				Run: `echo "$VAR_1"
echo "$VAR_2"
echo "$VAR_3"
echo "Hello Autopilot 1!"
echo '{"status": "GREEN"}'
echo '{"outputs": {"output1": "output1_value", "output2": "output2_value"}}'
echo '{"reason": "This is a reason"}'
echo "BANANAS" > bananas.txt
`,
				Env: map[string]string{
					"VAR_2": "autopilot1_var_2",
				},
			},
		},
		{
			Chapter: configuration.Chapter{
				Title: "chapter 1",
				Id:    "1",
			},
			Requirement: configuration.Requirement{
				Title: "requirement 4",
				Text:  "requirement text 4",
				Id:    "4",
			},
			Check: configuration.Check{
				Id:    "6",
				Title: "check 6",
			},
			Config: map[string]string{},
			Autopilot: configuration.Autopilot{
				Name: "autopilot3",
				Run: `app1
app2@1.0.0
app3@latest
`,
			},
			AppReferences: []*configuration.AppReference{
				{
					Name:       "app1",
					Version:    "1.0.0",
					Repository: "",
				},
				{
					Name:       "app2",
					Version:    "1.0.0",
					Repository: "repo1",
				},
				{
					Name:       "app3",
					Version:    "latest",
					Repository: "repo2",
				},
			},
		},
	}

	executionPlan, err := config.Parse()
	assert.Nil(t, err)
	assert.Equal(t, defaultVars, (*executionPlan).DefaultVars)
	assert.Equal(t, globalEnv, (*executionPlan).Env)
	assert.Equal(t, finalize, (*executionPlan).Finalize)
	assert.Equal(t, len(items), len((*executionPlan).Items))
	for _, item1 := range (*executionPlan).Items {
		for _, item2 := range items {
			if item1.Check.Id == item2.Check.Id {
				assert.Equal(t, item2.Chapter, item1.Chapter)
				assert.Equal(t, item2.Requirement, item1.Requirement)
				assert.Equal(t, item2.Check, item1.Check)
				assert.Equal(t, item2.Env, item1.Env)
				assert.Equal(t, item2.AppPath, item1.AppPath)
				assert.Equal(t, item2.Config, item1.Config)
				assert.Equal(t, item2.Autopilot, item1.Autopilot)
				assert.Equal(t, item2.Manual, item1.Manual)
				assert.Equal(t, item2.ValidationErr, item1.ValidationErr)
				assert.Equal(t, item2.AppReferences, item1.AppReferences)
			}
		}
	}
}

func TestParseAutopilotReferences(t *testing.T) {
	cases := []struct {
		name                string
		autopilots          map[string]Autopilot
		autopilotReferences []string
		expectedItems       int
		expectedError       error
	}{{
		name: "should return correct items for valid autopilot references",
		autopilots: map[string]Autopilot{
			"autopilot1": {
				Run: "echo 'Hello Autopilot 1!'",
			},
			"autopilot2": {
				Run: "echo 'Hello Autopilot 2!'",
			},
		},
		autopilotReferences: []string{
			"autopilot1",
			"autopilot2",
		},
		expectedItems: 2,
		expectedError: nil,
	},
		{
			name: "should not return error for invalid autopilot references",
			autopilots: map[string]Autopilot{
				"autopilot1": {
					Run: "echo 'Hello Autopilot 1!'",
				},
				"autopilot2": {
					Run: "echo 'Hello Autopilot 2!'",
				},
			},
			autopilotReferences: []string{
				"autopilot1",
				"autopilot3",
			},
			expectedItems: 2,
			expectedError: nil,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			checks := make(map[string]Check)
			for index, autopilotReference := range tc.autopilotReferences {
				checks[strconv.Itoa(index)] = Check{
					Automation: Automation{
						Autopilot: autopilotReference,
					},
				}
			}
			config := Config{
				Autopilots: tc.autopilots,
				Chapters: map[string]Chapter{
					"1": {
						Requirements: map[string]Requirement{
							"1": {
								Checks: checks,
							},
						},
					},
				},
			}

			executionPlan, err := config.Parse()
			if tc.expectedError != nil {
				assert.ErrorContains(t, err, tc.expectedError.Error())
			} else {
				assert.Equal(t, tc.expectedItems, len((*executionPlan).Items))
				assert.Nil(t, err)
			}
		})
	}

}

func TestParseMissingAutopilot(t *testing.T) {
	configStr := `
metadata:
	version: v1

header:
	name: Test
	version: 0.1.0

chapters:
	"1":
		title: Test
		text: Test
		requirements:
			"1":
				title: Test
				checks:
					"1":  
						title: Test
						automation:
							autopilot: missing-autopilot`
	expectedPlan := configuration.ExecutionPlan{
		Metadata: configuration.Metadata{
			Version: "v1",
		},
		Header: configuration.Header{
			Name:    "Test",
			Version: "0.1.0",
		},
		Items: []configuration.Item{
			{
				Chapter: configuration.Chapter{
					Id:    "1",
					Title: "Test",
					Text:  "Test",
				},
				Requirement: configuration.Requirement{
					Id:    "1",
					Title: "Test",
					Text:  "",
				},
				Check: configuration.Check{
					Id:    "1",
					Title: "Test",
				},
				Autopilot: configuration.Autopilot{
					Name: "missing-autopilot",
				},
				Manual:        configuration.Manual{},
				Config:        map[string]string{},
				ValidationErr: "autopilot missing-autopilot not found",
			},
		},
		Finalize:     configuration.Item{},
		Repositories: []configuration.Repository{},
	}

	configStr = strings.ReplaceAll(configStr, "\t", "  ")
	config, err := New([]byte(configStr))
	assert.Nil(t, err)
	plan, err := config.Parse()
	assert.Nil(t, err)
	assert.Equal(t, expectedPlan, *plan)
}

func TestParseInvalidAppReference(t *testing.T) {
	configStr := `metadata:
    version: v1
header:
    name: Project name
    version: ${{ vars.PROJECT_VERSION }}
repositories:
    - name: repo1
      type: curl
      configuration:
        url: https://repo1.com/{name}/{version}
        auth:
            username: user
            password: pass
autopilots:
    autopilot3:
        apps:
            - app1-1.0.0
            - repo1;;app2@1.0.0
            - repo1::app3latest
            - repo1::app#1@latest
            - app1@l#atest
            - repo2::app3@latest
        run: |
            app1
            app2@1.0.0
            app3@latest
finalize:
    run: |
        html-finalizer
        zip-finalizer
chapters: 
    '1':
        title: chapter 1
        requirements:
            '4':
                title: requirement 4
                text: requirement text 4
                checks:
                    '6':
                        title: check 6
                        automation:
                            autopilot: autopilot3
`
	configStr = strings.ReplaceAll(configStr, "\t", "  ")
	expectedValidationErr := `app identifier app1-1.0.0 is invalid: error creating app reference: app version must be set in app reference
app identifier repo1;;app2@1.0.0 is invalid: error creating app reference: app name contains reserved characters [; ;]
app identifier repo1::app3latest is invalid: error creating app reference: app version must be set in app reference
app identifier repo1::app#1@latest is invalid: error creating app reference: app name contains unsafe characters [#]
app identifier app1@l#atest is invalid: error creating app reference: app version contains unsafe characters [#]
repository repo2 referenced in app repo2::app3@latest not found`

	cfg, err := New([]byte(configStr))
	assert.Nil(t, err)
	assert.NotNil(t, cfg)
	parsed, err := cfg.Parse()
	assert.Nil(t, err)
	assert.NotNil(t, parsed)
	assert.Equal(t, 1, len(parsed.Items))
	assert.Equal(t, 0, len(parsed.Items[0].AppReferences))

	assert.Equal(t, expectedValidationErr, parsed.Items[0].ValidationErr)
}
