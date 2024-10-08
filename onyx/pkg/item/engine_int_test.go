//go:build integration
// +build integration

package item

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/stretchr/testify/assert"
)

func TestEngineRun(t *testing.T) {
	env := map[string]string{
		"ENV_VAR": "env_value",
	}
	vars := map[string]string{
		"VAR": "value",
	}
	secrets := map[string]string{
		"SECRET": "secret_value",
	}
	testCases := map[string]struct {
		name    string
		items   []configuration.Item
		want    []Result
		wantErr error
	}{
		"should return nil when items is nil": {
			items: nil,
			want:  nil,
		},
		"should return results for all items": {
			items: []configuration.Item{
				{
					Manual: configuration.Manual{
						Status: "GREEN",
						Reason: "completed manually",
					},
				},
				{
					Autopilot: configuration.Autopilot{
						Name: "autopilot",
						Run:  `echo '{"status": "FAILED", "reason": "hello world"}'`,
						Env: map[string]string{
							"foo": "bar",
						},
					},
				},
			},
			want: []Result{
				{
					Output: &executor.Output{
						ExitCode:      0,
						Status:        "GREEN",
						Reason:        "completed manually",
						ExecutionType: "Manual",
					},
				},
				{
					Output: &executor.Output{
						ExitCode:      0,
						Status:        "FAILED",
						Reason:        "hello world",
						ExecutionType: "Automation",
						Logs: []string{
							`{"status": "FAILED", "reason": "hello world"}`,
						},
					},
				},
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			e := NewEngine(tmpDir, true, 10*time.Minute)

			// act
			got, err := e.Run(&tc.items, env, vars, secrets)

			// assert
			assert.NotNil(t, got)
			assert.NoError(t, err)
			for i := range got {
				assert.Equal(t, &tc.items[i], got[i].Config)
				assert.Equal(t, tc.want[i].Output.ExitCode, got[i].Output.ExitCode)
				assert.Equal(t, tc.want[i].Output.Status, got[i].Output.Status)
				assert.Equal(t, tc.want[i].Output.Reason, got[i].Output.Reason)
				for j := range tc.want[i].Output.Logs {
					assert.Equal(t, tc.want[i].Output.Logs[j], got[i].Output.Logs[j])
				}
			}
		})
	}
}
