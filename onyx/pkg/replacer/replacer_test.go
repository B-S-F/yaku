//go:build unit
// +build unit

package replacer

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/stretchr/testify/assert"
)

type MockReplacer struct {
	StructFunc func(v interface{}, env map[string]string) error
	StringFunc func(s string, env map[string]string) (string, error)
	MatchFunc  func(m string, env map[string]string, visited map[string]bool) (string, error)
	EnvFunc    func(m *map[string]string, env map[string]string) error
}

func (r *MockReplacer) Struct(v interface{}, env map[string]string) error {
	return r.StructFunc(v, env)
}

func (r *MockReplacer) string(s string, env map[string]string) (string, error) {
	return r.StringFunc(s, env)
}

func (r *MockReplacer) match(m string, env map[string]string, visited map[string]bool) (string, error) {
	return r.MatchFunc(m, env, visited)
}

func (r *MockReplacer) Env(m *map[string]string, env map[string]string) error {
	return r.EnvFunc(m, env)
}

var executionPlan = configuration.ExecutionPlan{
	Metadata: configuration.Metadata{
		Version: "1.0",
	},
	Header: configuration.Header{
		Version: "1.1",
		Name:    "${{ env.VAR1 }}",
	},
	Repositories: []configuration.Repository{
		{
			Name: "${{ vars.VARS1 }}",
			Type: "${{ env.VAR1 }}",
			Config: map[string]interface{}{"key": "${{ env.VAR1 }}",
				"key2": map[string]string{"key": "${{ secrets.SECRETS1 }}"},
				"key3": []string{"${{ env.VAR1 }}", "${{ vars.VARS1 }}"},
				"key4": map[string]interface{}{"key": "${{ vars.VARS1 }}"},
			},
		},
	},
	Items: []configuration.Item{
		{
			Chapter: configuration.Chapter{
				Id:    "1",
				Title: "Test Chapter 1",
				Text:  "Test Chapter 1 Text ${{ env.VAR1 }}",
			},
			Requirement: configuration.Requirement{
				Id:    "1",
				Title: "Test Requirement 1",
				Text:  "Test Requirement 1 Text ${{ env.VAR1 }}",
			},
			Check: configuration.Check{
				Id:    "1",
				Title: "Test Check 1 ${{ env.VAR1 }}",
			},
			Env: map[string]string{
				"VAR1":     "check_value1",
				"VAR3":     "${{ env.VAR2 }}",
				"VARS1":    "${{ vars.VARS1 }}",
				"SECRETS1": "${{ secrets.SECRETS1 }}",
			},
			Config: TestConfig,
			Autopilot: configuration.Autopilot{
				Name: "Test Autopilot 1",
				Run:  "Test Autopilot 1 Run: ${{ env.VAR1 }} ${{ env.VAR2 }} ${{ env.VAR3 }}",
				Env: map[string]string{
					"VAR1":     "autopilot_value1",
					"VAR2":     "autopilot_value2",
					"VAR4":     "${{ env.VAR1 }}",
					"VARS1":    "${{ vars.VARS1 }}",
					"VARS4":    "${{ vars.VARS4 }}",
					"SECRETS1": "${{ secrets.SECRETS1 }}",
				},
			},
			AppReferences: []*configuration.AppReference{
				{
					Name:       "${{ env.VAR1 }}",
					Version:    "${{ vars.VARS1 }}",
					Repository: "${{ secrets.SECRETS1 }}",
				},
			},
		},
		{
			Chapter: configuration.Chapter{
				Id:    "2",
				Title: "Test Chapter 2",
				Text:  "Test Chapter 2 Text ${{ env.VAR1 }}",
			},
			Requirement: configuration.Requirement{
				Id:    "2",
				Title: "Test Requirement 2",
				Text:  "Test Requirement 2 Text ${{ env.VAR1 }}",
			},
			Check: configuration.Check{
				Id:    "2",
				Title: "Test Check 2 ${{ env.VAR1 }}",
			},
			Manual: configuration.Manual{
				Status: "GREEN",
				Reason: "Test Reason ${{ env.VAR1 }}",
			},
		},
	},
	Finalize: configuration.Item{
		Autopilot: configuration.Autopilot{
			Run: "Test Finalize Run: ${{ env.VAR1 }} ${{ env.VAR2 }}",
			Env: map[string]string{
				"VAR1":     "finalize_value1",
				"VAR3":     "${{ env.VAR2 }}",
				"VARS1":    "${{ vars.VARS1 }}",
				"SECRETS1": "${{ secrets.SECRETS1 }}",
				"ENVS":     "${{ envs.VAR2 }}",
				"SECRET":   "${{ secret.SECRETS1 }}",
				"VAR":      "${{ var.VARS1 }}",
			},
		},
		Config: TestConfigFinalize,
	},
	Env: map[string]string{
		"VAR1":        "global_value1",
		"VAR2":        "global_value2",
		"VAR3":        "global_value3",
		"VAR_VARS":    "${{ vars.VARS1}}",
		"VAR_SECRETS": "${{ secrets.SECRETS1 }}",
		"ENV":         "${{ env.VAR1 }}",
	},
	DefaultVars: map[string]string{
		"VARS4": "default_value4",
		"VARS1": "default_value1",
	},
}

var TestConfig = map[string]string{
	"config1.yaml":    "config1 ${{ env.VAR1 }}",
	"config2.yaml":    "config2 ${{ env.VAR1 }}",
	"${{ env.VAR1 }}": "config3 ${{ env.VAR1 }}",
}

var TestConfigFinalize = map[string]string{
	"config1.yaml": "config1 ${{ env.VAR1 }}",
	"config2.yaml": "config2 ${{ vars.VARS1 }}",
}

var varsContent = map[string]string{
	"VARS1": "vars_value1",
	"VARS2": "vars_value2",
}

var secretsContent = map[string]string{
	"SECRETS1": "secrets_value1",
	"SECRETS2": "secrets_value2",
}

func TestReplacerRun(t *testing.T) {
	t.Run("should replace all variables", func(t *testing.T) {
		ep := executionPlan
		err := Run(&ep, varsContent, secretsContent, Initial)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		er2r := Run(&ep, varsContent, secretsContent, ConfigValues)
		if er2r != nil {
			t.Errorf("unexpected error: %v", err)
		}
		// metadata + header
		assert.Equal(t, "1.0", ep.Metadata.Version, "metadata should be equal")
		assert.Equal(t, configuration.Header{Name: "global_value1", Version: "1.1"}, ep.Header, "header should be equal")
		// global env
		assert.Equal(t, map[string]string{
			"ENV":         "",
			"VAR1":        "global_value1",
			"VAR2":        "global_value2",
			"VAR3":        "global_value3",
			"VAR_VARS":    "vars_value1",
			"VAR_SECRETS": "secrets_value1",
		}, ep.Env, "global env should be equal")
		// repositories
		assert.Equal(t, "vars_value1", ep.Repositories[0].Name, "repository name should be equal")
		assert.Equal(t, "global_value1", ep.Repositories[0].Type, "repository type should be equal")
		assert.Equal(t, map[string]interface{}{
			"key":  "global_value1",
			"key2": map[string]string{"key": "secrets_value1"},
			"key3": []string{"global_value1", "vars_value1"},
			"key4": map[string]interface{}{"key": "vars_value1"},
		}, ep.Repositories[0].Config, "repository config should be equal")
		// automation item
		assert.Equal(t, configuration.Chapter{Id: "1", Title: "Test Chapter 1", Text: "Test Chapter 1 Text global_value1"}, ep.Items[0].Chapter, "chapter should be equal")
		assert.Equal(t, configuration.Requirement{Id: "1", Title: "Test Requirement 1", Text: "Test Requirement 1 Text global_value1"}, ep.Items[0].Requirement, "requirement should be equal")
		assert.Equal(t, configuration.Check{Id: "1", Title: "Test Check 1 check_value1"}, ep.Items[0].Check, "check should be equal")
		assert.Equal(t, map[string]string{"VAR1": "check_value1", "VAR3": "autopilot_value2", "VARS1": "vars_value1", "SECRETS1": "secrets_value1"}, ep.Items[0].Env, "item env should be equal")
		assert.Equal(t, map[string]string{"config1.yaml": "config1 check_value1", "config2.yaml": "config2 check_value1", "check_value1": "config3 check_value1"}, ep.Items[0].Config, "item config should be equal")
		assert.Equal(t, "Test Autopilot 1 Run: check_value1 autopilot_value2 autopilot_value2", ep.Items[0].Autopilot.Run, "autopilot run should be equal")
		assert.Equal(t, map[string]string{"SECRETS1": "secrets_value1", "VAR1": "autopilot_value1", "VAR2": "autopilot_value2", "VAR4": "global_value1", "VARS1": "vars_value1", "VARS4": "default_value4"}, ep.Items[0].Autopilot.Env, "autopilot env should be equal")
		assert.Equal(t, []*configuration.AppReference{{Name: "global_value1", Version: "vars_value1", Repository: "secrets_value1"}}, ep.Items[0].AppReferences, "app references should be equal")
		// manual item
		assert.Equal(t, configuration.Chapter{Id: "2", Title: "Test Chapter 2", Text: "Test Chapter 2 Text global_value1"}, ep.Items[1].Chapter, "chapter should be equal")
		assert.Equal(t, configuration.Requirement{Id: "2", Title: "Test Requirement 2", Text: "Test Requirement 2 Text global_value1"}, ep.Items[1].Requirement, "requirement should be equal")
		assert.Equal(t, configuration.Check{Id: "2", Title: "Test Check 2 global_value1"}, ep.Items[1].Check, "check should be equal")
		assert.Equal(t, configuration.Manual{Status: "GREEN", Reason: "Test Reason global_value1"}, ep.Items[1].Manual, "manual should be equal")
		// finalize
		assert.Equal(t, "Test Finalize Run: finalize_value1 global_value2", ep.Finalize.Autopilot.Run, "finalize run should be equal")
		assert.Equal(t, map[string]string{
			"SECRETS1": "secrets_value1",
			"VAR1":     "finalize_value1",
			"VAR3":     "global_value2",
			"VARS1":    "vars_value1",
			"VAR":      "vars_value1",
			"ENVS":     "global_value2",
			"SECRET":   "secrets_value1",
		}, ep.Finalize.Autopilot.Env, "finalize env should be equal")
		assert.Equal(t, map[string]string{"config1.yaml": "config1 finalize_value1", "config2.yaml": "config2 vars_value1"}, ep.Finalize.Config, "finalize config should be equal")
	})
}

func TestReplaceExecutionPlan(t *testing.T) {
	t.Run("should replace all env variables", func(t *testing.T) {
		ep := executionPlan
		varType := "env"
		env := helper.MergeMaps(helper.GetOsEnv(), ep.Env)
		r := New(&ep, &env, NewPattern(varType, "${{", "}}"), NewPattern(varType, "${", "}"))

		r.replace(varType, Initial)
		r.replace(varType, ConfigValues)
	})
	t.Run("should not replace secrets in config", func(t *testing.T) {
		ep := executionPlan
		ep.Items[0].Config = map[string]string{
			"config1.yaml": "config1 ${{ secrets.SECRETS1 }}",
		}
		varType := "secrets"
		secrets := map[string]string{
			"SECRETS1": "secrets_value1",
		}
		ep.Items[0].Config["config1.yaml"] = "config1 ${{ secrets.SECRETS1 }}"
		r := New(&ep, &secrets, NewPattern(varType, "${{", "}}"))

		r.replace(varType, Initial)
		r.replace(varType, ConfigValues)
		assert.Equal(t, map[string]string{"config1.yaml": "config1 ${{ secrets.SECRETS1 }}"}, ep.Items[0].Config, "item config should be equal")
	})
}
