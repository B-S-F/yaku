package replacer

import (
	"testing"

	config "github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

var varsContent = map[string]string{
	"VAR1":              "vars_value1",
	"VAR2":              "vars_value2",
	"AUTH_TYPE":         "basic",
	"CHAPTER_ID":        "ch1",
	"CHAPTER_TITLE":     "ch1-title",
	"CHAPTER_TEXT":      "ch1-text",
	"REQUIREMENT_ID":    "req1",
	"REQUIREMENT_TITLE": "req1-title",
	"REQUIREMENT_TEXT":  "req1-text",
	"CHECK_ID":          "check1",
	"CHECK_TITLE":       "check1-title",
	"CHECK_ENV":         "check1-env",
	"AUTOPILOT_NAME":    "autopilot1",
	"ENV1":              "env1",
	"ENV2":              "env2",
	"CONFIG_FILE":       "config-file",
	"OUTPUT_DIR":        "output-dir",
	"RESULT_FILE_1":     "result-file-1",
	"RESULT_FILE_2":     "result-file-2",
	"MANUAL_STATUS":     "manual-status",
	"MANUAL_REASON":     "manual-reason",
}

var secretsContent = map[string]string{
	"SECRET1":         "secrets_value1",
	"SECRET2":         "secrets_value2",
	"GITHUB_USERNAME": "github_username",
	"GITHUB_PASSWORD": "github_password",
}

func TestReplaceRun(t *testing.T) {
	executionPlan := simpleExecPlan()

	err := Run(
		executionPlan,
		varsContent,
		secretsContent,
		Initial,
	)

	if err != nil {
		t.Errorf("Error running replacer: %v", err)
	}

	err = Run(
		executionPlan,
		varsContent,
		secretsContent,
		ConfigValues,
	)

	if err != nil {
		t.Errorf("Error running replacer: %v", err)
	}

	// metadata
	assert.Equal(t, "2", executionPlan.Metadata.Version, "metadata should be equal")
	// header
	assert.Equal(t, config.Header{
		Name:    "onyx-1",
		Version: "1.0.0",
	}, executionPlan.Header, "header should be equal")
	// default vars
	assert.Equal(t, map[string]string{
		"REVISION": "1",
		"VERSION":  "1.0.0",
	}, executionPlan.DefaultVars, "default vars should be equal")
	// env
	assert.Equal(t, map[string]string{
		"NAME":              "onyx",
		"ENV1":              "env1",
		"VAR1":              "vars_value1",
		"SECRET1":           "secrets_value1",
		"REVISION":          "1",
		"GITHUB_URL":        "https://github.com",
		"CHAPTER_ID":        "ch1",
		"CHAPTER_TITLE":     "ch1-title",
		"CHAPTER_TEXT":      "ch1-text",
		"REQUIREMENT_ID":    "req1",
		"REQUIREMENT_TITLE": "req1-title",
		"REQUIREMENT_TEXT":  "req1-text",
		"CHECK_ID":          "check1",
		"CHECK_TITLE":       "check1-title",
		"CHECK_ENV":         "check1-env",
		"AUTOPILOT_NAME":    "autopilot1",
		"ENV2":              "env2",
		"CONFIG_FILE":       "config-file",
		"OUTPUT_DIR":        "output-dir",
		"RESULT_FILE_1":     "result-file-1",
		"RESULT_FILE_2":     "result-file-2",
		"MANUAL_STATUS":     "manual-status",
		"MANUAL_REASON":     "manual-reason",
		"OVERRIDE1_ENV":     "override-env",
		"OVERRIDE2_ENV":     "override-env",
		"OVERRIDE3_ENV":     "override-env",
		"CONFIG_FILE_KEY":   "config-file-key",
	}, executionPlan.Env, "env should be equal")
	// repositories
	assert.Equal(t, []config.Repository{
		{
			Name: "github",
			Type: "curl",
			Config: map[string]interface{}{
				"url": "https://github.com",
				"auth": map[string]string{
					"type":     "basic",
					"username": "github_username",
					"password": "github_password",
				},
			},
		},
	}, executionPlan.Repositories, "repositories should be equal")
	// autopilot item
	autopilotItem := executionPlan.AutopilotChecks[0]
	assert.Equal(t, config.Chapter{
		Id:    "ch1,ch1",
		Title: "ch1-title,ch1-title",
		Text:  "ch1-text,ch1-text",
	}, autopilotItem.Chapter, "chapter should be equal")

	assert.Equal(t, config.Requirement{
		Id:    "req1,req1",
		Title: "req1-title,req1-title",
		Text:  "req1-text,req1-text",
	}, autopilotItem.Requirement, "requirement should be equal")

	assert.Equal(t, config.Check{
		Id:    "check1,check1",
		Title: "check1-title,check1-title",
	}, autopilotItem.Check, "check should be equal")

	assert.Equal(t, []*config.AppReference{
		{
			Repository: "github",
			Name:       "app1",
			Version:    "1.0.0",
		},
	}, autopilotItem.AppReferences, "app references should be equal")

	assert.Equal(t, map[string]string{
		"ENV1":          "check1-env,check1-env",
		"OVERRIDE1_ENV": "override-check-env",
	}, autopilotItem.CheckEnv, "check env should be equal")

	assert.Equal(t, model.Autopilot{
		Name: "autopilot1,autopilot1",
		Env: map[string]string{
			"ENV1":          "env1,env1",
			"ENV2":          "env2,env2",
			"OVERRIDE1_ENV": "override-autopilot-env",
			"OVERRIDE2_ENV": "override-autopilot-env",
			"OVERRIDE3_ENV": "override-autopilot-env",
		},
		Steps: [][]model.Step{{
			{
				Title: "step-1",
				ID:    "fetch1",
				Env: map[string]string{
					"ENV1":          "check1-env,check1-env,env1",
					"OVERRIDE1_ENV": "override-step-env",
					"OVERRIDE2_ENV": "override-autopilot-env",
					"OVERRIDE3_ENV": "override-step-env",
				},
				Configs: map[string]string{
					"config-file":     "config-file,config-file",
					"config-file-key": "config-file",
				},

				Run: "sharepoint-fetcher --config-file=config-file,config-file --output-dir=output-dir,output-dir override-check-env override-autopilot-env override-step-env",
				Depends: []string{
					"fetch2",
				},
			},
		}},
		Evaluate: model.Evaluate{
			Env: map[string]string{
				"RESULT_FILE_1": "result-file-1,result-file-1",
				"RESULT_FILE_2": "result-file-2,result-file-2",
				"OVERRIDE1_ENV": "override-evaluate-env",
				"OVERRIDE2_ENV": "override-autopilot-env",
				"OVERRIDE3_ENV": "override-evaluate-env",
			},
			Configs: map[string]string{
				"config-file":     "config-file,config-file",
				"config-file-key": "config-file",
			},
			Run: `sharepoint-evaulator --config-file=config-file,config-file --output-dir=output-dir,output-dir override-check-env override-autopilot-env override-evaluate-env`,
		},
	}, autopilotItem.Autopilot, "autopilot should be equal")

	// manual item
	assert.Equal(t, config.Chapter{
		Id:    "ch1,ch1",
		Title: "ch1-title,ch1-title",
		Text:  "ch1-text,ch1-text",
	}, executionPlan.ManualChecks[0].Chapter, "chapter should be equal")

	assert.Equal(t, config.Requirement{
		Id:    "req1,req1",
		Title: "req1-title,req1-title",
		Text:  "req1-text,req1-text",
	}, executionPlan.ManualChecks[0].Requirement, "requirement should be equal")

	assert.Equal(t, config.Check{
		Id:    "check1,check1",
		Title: "check1-title,check1-title",
	}, executionPlan.ManualChecks[0].Check, "check should be equal")

	assert.Equal(t, config.Manual{
		Status: "manual-status,manual-status",
		Reason: "manual-reason,manual-reason",
	}, executionPlan.ManualChecks[0].Manual, "manual should be equal")

	// finalize item
	assert.Equal(t, map[string]string{
		"RESULT_FILE_1": "result-file-1,result-file-1",
		"RESULT_FILE_2": "result-file-2,result-file-2",
		"OVERRIDE1_ENV": "override-finalize-env",
	}, executionPlan.Finalize.Env, "finalize env should be equal")

	assert.Equal(t, map[string]string{
		"config-file":     "config-file,config-file",
		"config-file-key": "config-file",
	}, executionPlan.Finalize.Configs, "finalize configs should be equal")

	assert.Equal(t, `sharepoint-finalizer --config-file=config-file,config-file --output-dir=output-dir,output-dir override-finalize-env`, executionPlan.Finalize.Run, "finalize run should be equal")
}

func TestReplaceRunWithoutFinalizer(t *testing.T) {
	executionPlan := simpleExecPlan()
	executionPlan.Finalize = nil

	err := Run(
		executionPlan,
		varsContent,
		secretsContent,
		Initial,
	)

	if err != nil {
		t.Errorf("Error running replacer: %v", err)
	}

	err = Run(
		executionPlan,
		varsContent,
		secretsContent,
		ConfigValues,
	)

	if err != nil {
		t.Errorf("Error running replacer: %v", err)
	}

	// metadata
	assert.Equal(t, "2", executionPlan.Metadata.Version, "metadata should be equal")
	// header
	assert.Equal(t, config.Header{
		Name:    "onyx-1",
		Version: "1.0.0",
	}, executionPlan.Header, "header should be equal")
	// default vars
	assert.Equal(t, map[string]string{
		"REVISION": "1",
		"VERSION":  "1.0.0",
	}, executionPlan.DefaultVars, "default vars should be equal")
	// env
	assert.Equal(t, map[string]string{
		"NAME":              "onyx",
		"ENV1":              "env1",
		"VAR1":              "vars_value1",
		"SECRET1":           "secrets_value1",
		"REVISION":          "1",
		"GITHUB_URL":        "https://github.com",
		"CHAPTER_ID":        "ch1",
		"CHAPTER_TITLE":     "ch1-title",
		"CHAPTER_TEXT":      "ch1-text",
		"REQUIREMENT_ID":    "req1",
		"REQUIREMENT_TITLE": "req1-title",
		"REQUIREMENT_TEXT":  "req1-text",
		"CHECK_ID":          "check1",
		"CHECK_TITLE":       "check1-title",
		"CHECK_ENV":         "check1-env",
		"AUTOPILOT_NAME":    "autopilot1",
		"ENV2":              "env2",
		"CONFIG_FILE":       "config-file",
		"OUTPUT_DIR":        "output-dir",
		"RESULT_FILE_1":     "result-file-1",
		"RESULT_FILE_2":     "result-file-2",
		"MANUAL_STATUS":     "manual-status",
		"MANUAL_REASON":     "manual-reason",
		"OVERRIDE1_ENV":     "override-env",
		"OVERRIDE2_ENV":     "override-env",
		"OVERRIDE3_ENV":     "override-env",
		"CONFIG_FILE_KEY":   "config-file-key",
	}, executionPlan.Env, "env should be equal")
	// repositories
	assert.Equal(t, []config.Repository{
		{
			Name: "github",
			Type: "curl",
			Config: map[string]interface{}{
				"url": "https://github.com",
				"auth": map[string]string{
					"type":     "basic",
					"username": "github_username",
					"password": "github_password",
				},
			},
		},
	}, executionPlan.Repositories, "repositories should be equal")
	// autopilot item
	autopilotItem := executionPlan.AutopilotChecks[0]
	assert.Equal(t, config.Chapter{
		Id:    "ch1,ch1",
		Title: "ch1-title,ch1-title",
		Text:  "ch1-text,ch1-text",
	}, autopilotItem.Chapter, "chapter should be equal")

	assert.Equal(t, config.Requirement{
		Id:    "req1,req1",
		Title: "req1-title,req1-title",
		Text:  "req1-text,req1-text",
	}, autopilotItem.Requirement, "requirement should be equal")

	assert.Equal(t, config.Check{
		Id:    "check1,check1",
		Title: "check1-title,check1-title",
	}, autopilotItem.Check, "check should be equal")

	assert.Equal(t, []*config.AppReference{
		{
			Repository: "github",
			Name:       "app1",
			Version:    "1.0.0",
		},
	}, autopilotItem.AppReferences, "app references should be equal")

	assert.Equal(t, map[string]string{
		"ENV1":          "check1-env,check1-env",
		"OVERRIDE1_ENV": "override-check-env",
	}, autopilotItem.CheckEnv, "check env should be equal")

	assert.Equal(t, model.Autopilot{
		Name: "autopilot1,autopilot1",
		Env: map[string]string{
			"ENV1":          "env1,env1",
			"ENV2":          "env2,env2",
			"OVERRIDE1_ENV": "override-autopilot-env",
			"OVERRIDE2_ENV": "override-autopilot-env",
			"OVERRIDE3_ENV": "override-autopilot-env",
		},
		Steps: [][]model.Step{{
			{
				Title: "step-1",
				ID:    "fetch1",
				Env: map[string]string{
					"ENV1":          "check1-env,check1-env,env1",
					"OVERRIDE1_ENV": "override-step-env",
					"OVERRIDE2_ENV": "override-autopilot-env",
					"OVERRIDE3_ENV": "override-step-env",
				},
				Configs: map[string]string{
					"config-file":     "config-file,config-file",
					"config-file-key": "config-file",
				},

				Run: "sharepoint-fetcher --config-file=config-file,config-file --output-dir=output-dir,output-dir override-check-env override-autopilot-env override-step-env",
				Depends: []string{
					"fetch2",
				},
			},
		}},
		Evaluate: model.Evaluate{
			Env: map[string]string{
				"RESULT_FILE_1": "result-file-1,result-file-1",
				"RESULT_FILE_2": "result-file-2,result-file-2",
				"OVERRIDE1_ENV": "override-evaluate-env",
				"OVERRIDE2_ENV": "override-autopilot-env",
				"OVERRIDE3_ENV": "override-evaluate-env",
			},
			Configs: map[string]string{
				"config-file":     "config-file,config-file",
				"config-file-key": "config-file",
			},
			Run: `sharepoint-evaulator --config-file=config-file,config-file --output-dir=output-dir,output-dir override-check-env override-autopilot-env override-evaluate-env`,
		},
	}, autopilotItem.Autopilot, "autopilot should be equal")

	// manual item
	assert.Equal(t, config.Chapter{
		Id:    "ch1,ch1",
		Title: "ch1-title,ch1-title",
		Text:  "ch1-text,ch1-text",
	}, executionPlan.ManualChecks[0].Chapter, "chapter should be equal")

	assert.Equal(t, config.Requirement{
		Id:    "req1,req1",
		Title: "req1-title,req1-title",
		Text:  "req1-text,req1-text",
	}, executionPlan.ManualChecks[0].Requirement, "requirement should be equal")

	assert.Equal(t, config.Check{
		Id:    "check1,check1",
		Title: "check1-title,check1-title",
	}, executionPlan.ManualChecks[0].Check, "check should be equal")

	assert.Equal(t, config.Manual{
		Status: "manual-status,manual-status",
		Reason: "manual-reason,manual-reason",
	}, executionPlan.ManualChecks[0].Manual, "manual should be equal")

	// finalize item
	assert.Nil(t, executionPlan.Finalize)
}

func simpleExecPlan() *model.ExecutionPlan {
	return &model.ExecutionPlan{
		Metadata: config.Metadata{
			Version: "2",
		},
		Header: config.Header{
			Name:    "${{ env.NAME }}-${{ vars.REVISION }}",
			Version: "${{ vars.VERSION }}",
		},
		DefaultVars: map[string]string{
			"REVISION": "1",
			"VERSION":  "1.0.0",
		},
		Env: map[string]string{
			"NAME":              "onyx",
			"ENV1":              "env1",
			"VAR1":              "${{ vars.VAR1 }}",
			"SECRET1":           "${{ secrets.SECRET1 }}",
			"REVISION":          "${{ vars.REVISION }}",
			"GITHUB_URL":        "https://github.com",
			"CHAPTER_ID":        "ch1",
			"CHAPTER_TITLE":     "ch1-title",
			"CHAPTER_TEXT":      "ch1-text",
			"REQUIREMENT_ID":    "req1",
			"REQUIREMENT_TITLE": "req1-title",
			"REQUIREMENT_TEXT":  "req1-text",
			"CHECK_ID":          "check1",
			"CHECK_TITLE":       "check1-title",
			"CHECK_ENV":         "check1-env",
			"AUTOPILOT_NAME":    "autopilot1",
			"ENV2":              "env2",
			"CONFIG_FILE":       "config-file",
			"OUTPUT_DIR":        "output-dir",
			"RESULT_FILE_1":     "result-file-1",
			"RESULT_FILE_2":     "result-file-2",
			"MANUAL_STATUS":     "manual-status",
			"MANUAL_REASON":     "manual-reason",
			"OVERRIDE1_ENV":     "override-env",
			"OVERRIDE2_ENV":     "override-env",
			"OVERRIDE3_ENV":     "override-env",
			"CONFIG_FILE_KEY":   "config-file-key",
		},
		Repositories: []config.Repository{
			{
				Name: "github",
				Type: "curl",
				Config: map[string]interface{}{
					"url": "${{ env.GITHUB_URL }}",
					"auth": map[string]string{
						"type":     "${{ vars.AUTH_TYPE }}",
						"username": "${{ secrets.GITHUB_USERNAME }}",
						"password": "${{ secrets.GITHUB_PASSWORD }}",
					},
				},
			},
		},
		AutopilotChecks: []model.AutopilotCheck{
			{
				Item: model.Item{
					Chapter: config.Chapter{
						Id:    "${{ env.CHAPTER_ID }},${{ vars.CHAPTER_ID }}",
						Title: "${{ env.CHAPTER_TITLE}},${{ vars.CHAPTER_TITLE }}",
						Text:  "${{ env.CHAPTER_TEXT }},${{ vars.CHAPTER_TEXT }}",
					},
					Requirement: config.Requirement{
						Id:    "${{ env.REQUIREMENT_ID }},${{ vars.REQUIREMENT_ID }}",
						Title: "${{ env.REQUIREMENT_TITLE }},${{ vars.REQUIREMENT_TITLE }}",
						Text:  "${{ env.REQUIREMENT_TEXT }},${{ vars.REQUIREMENT_TEXT }}",
					},
					Check: config.Check{
						Id:    "${{ env.CHECK_ID }},${{ vars.CHECK_ID }}",
						Title: "${{ env.CHECK_TITLE }},${{ vars.CHECK_TITLE }}",
					},
				},
				CheckEnv: map[string]string{"ENV1": "${{ env.CHECK_ENV }},${{ vars.CHECK_ENV }}", "OVERRIDE1_ENV": "override-check-env"},
				AppReferences: []*config.AppReference{
					{
						Repository: "github",
						Name:       "app1",
						Version:    "1.0.0",
					},
				},
				Autopilot: model.Autopilot{
					Name: "${{ env.AUTOPILOT_NAME }},${{ vars.AUTOPILOT_NAME }}",
					Env: map[string]string{
						"ENV1":          "${{ env.ENV1 }},${{ vars.ENV1 }}",
						"ENV2":          "${{ env.ENV2 }},${{ vars.ENV2 }}",
						"OVERRIDE1_ENV": "override-autopilot-env",
						"OVERRIDE2_ENV": "override-autopilot-env",
						"OVERRIDE3_ENV": "override-autopilot-env",
					},

					Steps: [][]model.Step{{
						{
							Title: "step-1",
							ID:    "fetch1",
							Env: map[string]string{
								"ENV1":          "${{ env.ENV1 }},${{ vars.ENV1 }}",
								"OVERRIDE1_ENV": "override-step-env",
								"OVERRIDE2_ENV": "${{ env.OVERRIDE2_ENV }}",
								"OVERRIDE3_ENV": "override-step-env",
							},
							Configs: map[string]string{
								"config-file":                "${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }}",
								"${{ env.CONFIG_FILE_KEY }}": "${{ vars.CONFIG_FILE }}",
							},
							Run: "sharepoint-fetcher --config-file=${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }} --output-dir=${{ env.OUTPUT_DIR }},${{ vars.OUTPUT_DIR }} ${{ env.OVERRIDE1_ENV }} ${{ env.OVERRIDE2_ENV }} ${{ env.OVERRIDE3_ENV }}",
							Depends: []string{
								"fetch2",
							},
						}}},

					Evaluate: model.Evaluate{
						Env: map[string]string{
							"RESULT_FILE_1": "${{ env.RESULT_FILE_1 }},${{ vars.RESULT_FILE_1 }}",
							"RESULT_FILE_2": "${{ env.RESULT_FILE_2 }},${{ vars.RESULT_FILE_2 }}",
							"OVERRIDE1_ENV": "override-evaluate-env",
							"OVERRIDE2_ENV": "${{ env.OVERRIDE2_ENV }}",
							"OVERRIDE3_ENV": "override-evaluate-env",
						},
						Configs: map[string]string{
							"config-file":                "${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }}",
							"${{ env.CONFIG_FILE_KEY }}": "${{ vars.CONFIG_FILE }}",
						},
						Run: `sharepoint-evaulator --config-file=${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }} --output-dir=${{ env.OUTPUT_DIR }},${{ vars.OUTPUT_DIR }} ${{ env.OVERRIDE1_ENV }} ${{ env.OVERRIDE2_ENV }} ${{ env.OVERRIDE3_ENV }}`,
					},
				},
			},
		},
		ManualChecks: []model.ManualCheck{
			{
				Item: model.Item{
					Chapter: config.Chapter{
						Id:    "${{ env.CHAPTER_ID }},${{ vars.CHAPTER_ID }}",
						Title: "${{ env.CHAPTER_TITLE }},${{ vars.CHAPTER_TITLE }}",
						Text:  "${{ env.CHAPTER_TEXT }},${{ vars.CHAPTER_TEXT }}",
					},
					Requirement: config.Requirement{
						Id:    "${{ env.REQUIREMENT_ID }},${{ vars.REQUIREMENT_ID }}",
						Title: "${{ env.REQUIREMENT_TITLE }},${{ vars.REQUIREMENT_TITLE }}",
						Text:  "${{ env.REQUIREMENT_TEXT }},${{ vars.REQUIREMENT_TEXT }}",
					},
					Check: config.Check{
						Id:    "${{ env.CHECK_ID }},${{ vars.CHECK_ID }}",
						Title: "${{ env.CHECK_TITLE }},${{ vars.CHECK_TITLE }}",
					},
				},
				Manual: config.Manual{
					Status: "${{ env.MANUAL_STATUS }},${{ vars.MANUAL_STATUS }}",
					Reason: "${{ env.MANUAL_REASON }},${{ vars.MANUAL_REASON }}",
				},
			},
		},
		Finalize: &model.Finalize{
			Env: map[string]string{
				"RESULT_FILE_1": "${{ env.RESULT_FILE_1 }},${{ vars.RESULT_FILE_1 }}",
				"RESULT_FILE_2": "${{ env.RESULT_FILE_2 }},${{ vars.RESULT_FILE_2 }}",
				"OVERRIDE1_ENV": "override-finalize-env",
			},
			Configs: map[string]string{
				"config-file":                "${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }}",
				"${{ env.CONFIG_FILE_KEY }}": "${{ vars.CONFIG_FILE }}",
			},
			Run: `sharepoint-finalizer --config-file=${{ env.CONFIG_FILE }},${{ vars.CONFIG_FILE }} --output-dir=${{ env.OUTPUT_DIR }},${{ vars.OUTPUT_DIR }} ${{ env.OVERRIDE1_ENV }}`,
		},
	}
}
