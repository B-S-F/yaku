//go:build unit
// +build unit

package transformer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestConfigsLoaderTransform(t *testing.T) {
	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.txt")
	err := os.WriteFile(configFile, []byte("config content"), 0644)
	if err != nil {
		t.Fatal(err)
	}

	testCases := map[string]struct {
		ep   *model.ExecutionPlan
		want *model.ExecutionPlan
	}{
		"should load config file and add it to the ExecutionPlan": {
			ep: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
				Autopilot: model.Autopilot{
					Steps: [][]model.Step{
						{{
							Configs: map[string]string{
								"config.txt": "",
							},
						}}},
					Evaluate: model.Evaluate{
						Configs: map[string]string{
							"config.txt": "",
						},
					}}}}},
			want: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
				Autopilot: model.Autopilot{
					Steps: [][]model.Step{
						{{
							Configs: map[string]string{
								"config.txt": "config content",
							},
						}}},
					Evaluate: model.Evaluate{
						Configs: map[string]string{
							"config.txt": "config content",
						},
					}}}}},
		},
		"should not load config file but continue if it does not exist": {
			ep: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
				Autopilot: model.Autopilot{
					Steps: [][]model.Step{
						{{
							Configs: map[string]string{
								"config2.txt": "",
							},
						}}},
					Evaluate: model.Evaluate{
						Configs: map[string]string{
							"config2.txt": "",
						},
					}}}}},
			want: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
				Autopilot: model.Autopilot{
					Steps: [][]model.Step{
						{{
							Configs: map[string]string{
								"config2.txt": "",
							},
						}}},
					Evaluate: model.Evaluate{
						Configs: map[string]string{
							"config2.txt": "",
						},
					}}}}},
		},
		"should load config file for finalizer": {
			ep: &model.ExecutionPlan{
				Finalize: &model.Finalize{
					Configs: map[string]string{
						"config.txt": "",
					}}},
			want: &model.ExecutionPlan{
				Finalize: &model.Finalize{
					Configs: map[string]string{
						"config.txt": "config content",
					},
				}}},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			d := NewConfigsLoader(tmpDir)
			err := d.Transform(tc.ep)
			assert.NoError(t, err)
			assert.Equal(t, tc.want, tc.ep)
		})
	}
}
