//go:build unit
// +build unit

package item

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestEngineExecuteItem(t *testing.T) {
	tmpDir := t.TempDir()
	logger.NewAutopilot()
	e := NewEngine(tmpDir, true, 10*time.Minute)
	env := map[string]string{"ENV_VAR": "env_value"}
	vars := map[string]string{"VAR": "value"}
	secrets := map[string]string{"SECRET": "secret_value"}

	testCases := map[string]struct {
		item       *configuration.Item
		wantOutput *executor.Output
	}{
		"should return result for manual item": {
			&configuration.Item{
				Manual: configuration.Manual{
					Status: "GREEN",
					Reason: "completed manually",
				},
			},
			&executor.Output{
				ExitCode:      0,
				Status:        "GREEN",
				Reason:        "completed manually",
				ExecutionType: "Manual",
			},
		},
		"should return result for autopilot item": {
			&configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "autopilot",
					Run:  `echo '{"status": "FAILED", "reason": "hello world"}'`,
					Env: map[string]string{
						"foo": "bar",
					},
				},
			},
			&executor.Output{
				ExitCode:      0,
				Status:        "FAILED",
				Reason:        "hello world",
				ExecutionType: "Automation",
				Logs: []string{
					`{"status": "FAILED", "reason": "hello world"}`,
				},
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got, err := e.executeItem(tc.item, env, vars, secrets)

			// assert
			assert.NoError(t, err)
			assert.NotNil(t, got)
			assert.Equal(t, tc.item, got.Config)
			assert.Equal(t, 0, got.Output.ExitCode)
			assert.Equal(t, tc.wantOutput.Status, got.Output.Status)
			assert.Equal(t, tc.wantOutput.Reason, got.Output.Reason)
			assert.Equal(t, tc.wantOutput.ExecutionType, got.Output.ExecutionType)
			assert.Equal(t, tc.wantOutput.Logs, got.Output.Logs)
		})
	}
}
