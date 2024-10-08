//go:build integration
// +build integration

package executor

import (
	"strings"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestAutopilotExecuteIntegration(t *testing.T) {
	item := &configuration.Item{
		Chapter: configuration.Chapter{
			Id: "chapter",
		},
		Requirement: configuration.Requirement{
			Id: "requirement",
		},
		Check: configuration.Check{
			Id: "check",
		},
		Config: map[string]string{
			"config1": "value1",
			"config2": "value2",
		},
		Autopilot: configuration.Autopilot{
			Name: "autopilot",
			Run:  "echo 'hello world'",
			Env: map[string]string{
				"ENV_VAR1": "value1",
				"ENV_VAR2": "value2",
			},
		},
	}
	testCases := map[string]struct {
		run          []string
		overrideItem *configuration.Item
		want         Output
	}{
		"should return output": {
			run: []string{
				`echo '{"status": "GREEN"}'`,
				`echo '{"reason": "hello world"}'`,
				`echo '{"output": {"key1": "value1", "key2": "value2"}}'`,
				`echo '{"result": {"criterion": "criteria1", "fulfilled": false, "justification": "reason1", "metadata": {"severity": "HIGH", "package": "package1"}}}'`,
			},
			want: Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Reason:        "hello world",
				Status:        "GREEN",
				Logs: []string{
					"{\"status\": \"GREEN\"}",
					"{\"reason\": \"hello world\"}",
					"{\"output\": {\"key1\": \"value1\", \"key2\": \"value2\"}}",
					"{\"result\": {\"criterion\": \"criteria1\", \"fulfilled\": false, \"justification\": \"reason1\", \"metadata\": {\"severity\": \"HIGH\", \"package\": \"package1\"}}}",
				},
				ErrLogs: nil,
				Results: []Result{{Criterion: "criteria1", Fulfilled: false, Justification: "reason1", Metadata: map[string]string{"severity": "HIGH", "package": "package1"}}},
				Outputs: map[string]string{"key1": "value1", "key2": "value2"},
			},
		},
		"should validate autopilot output and return error if invalid": {
			run: []string{
				`echo '{"status": "GREEN"}'`,
				`echo '{"reason": "hello world"}'`,
			},
			want: Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Reason:        "autopilot 'autopilot' did not provide any 'results'",
				Status:        "ERROR",
				Logs: []string{
					"{\"status\": \"GREEN\"}",
					"{\"reason\": \"hello world\"}",
				},
				ErrLogs: nil,
				Results: nil,
				Outputs: nil,
			},
		},
		"should not show secrets in logs": {
			run: []string{
				`echo '{"status": "FAILED"}'`,
				`echo '{"reason": "hello world"}'`,
				`echo "test_secret"`,
			},
			want: Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Reason:        "hello world",
				Status:        "FAILED",
				Logs: []string{
					"{\"status\": \"FAILED\"}",
					"{\"reason\": \"hello world\"}",
					"***TEST_SECRET***",
				},
				ErrLogs: nil,
				Results: nil,
				Outputs: nil,
			},
		},
		"should handle item errors": {
			overrideItem: &configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "autopilot",
				},
				ValidationErr: "error",
			},
			want: Output{
				ExecutionType: "None",
				ExitCode:      0,
				Reason:        "autopilot 'autopilot' is invalid and could not be executed: error",
				Status:        "ERROR",
				Logs:          nil,
				ErrLogs:       nil,
				Results:       nil,
				Outputs:       nil,
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpItem := *item
			tmpDir := t.TempDir()
			logger := logger.NewAutopilot()
			timeout := 10 * time.Minute
			if tc.overrideItem != nil {
				tmpItem = *tc.overrideItem
			} else {
				tmpItem.Autopilot.Run = strings.Join(tc.run, "\n")
			}
			a := NewAutopilot(true, tmpDir, timeout, logger)
			secrets := map[string]string{"TEST_SECRET": "test_secret"}

			// act
			output, err := a.Execute(&tmpItem, map[string]string{}, map[string]string{}, secrets)

			// assert
			assert.NotNil(t, output)
			assert.NoError(t, err)
			assert.Equal(t, tc.want.ExecutionType, output.ExecutionType)
			assert.Equal(t, tc.want.ExitCode, output.ExitCode)
			assert.Equal(t, tc.want.Reason, output.Reason)
			assert.Equal(t, tc.want.Status, output.Status)
			assert.Equal(t, tc.want.Logs, output.Logs)
			assert.Equal(t, tc.want.ErrLogs, output.ErrLogs)
			assert.Equal(t, tc.want.Results, output.Results)
			assert.Equal(t, tc.want.Outputs, output.Outputs)
		})
	}
}
