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

func TestFinalizerExecuteIntegration(t *testing.T) {
	item := &configuration.Item{
		Autopilot: configuration.Autopilot{
			Name: "autopilot",
			Run:  "echo 'hello world'",
			Env: map[string]string{
				"ENV_VAR1": "value1",
				"ENV_VAR2": "value2",
			},
		},
		Config: map[string]string{
			"config1": "value1",
			"config2": "value2",
		},
	}
	testCases := map[string]struct {
		run  []string
		want Output
	}{
		"should return output": {
			run: []string{
				"echo 'hello world'",
			},
			want: Output{
				ExecutionType: "",
				ExitCode:      0,
				Logs: []string{
					"hello world",
				},
				ErrLogs: nil,
			},
		},
		"should not show secrets in logs": {
			run: []string{
				`echo "test_secret"`,
			},
			want: Output{
				ExecutionType: "",
				ExitCode:      0,
				Logs: []string{
					"***TEST_SECRET***",
				},
				ErrLogs: nil,
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			logger := logger.NewAutopilot()
			item.Autopilot.Run = strings.Join(tc.run, "\n")
			f := NewFinalizer(tmpDir, 10*time.Minute, logger)
			secrets := map[string]string{"TEST_SECRET": "test_secret"}

			// act
			output, err := f.Execute(item, map[string]string{}, map[string]string{}, secrets)

			// assert
			assert.NotNil(t, output)
			assert.NoError(t, err)
			assert.Equal(t, tc.want.ExecutionType, output.ExecutionType)
			assert.Equal(t, tc.want.ExitCode, output.ExitCode)
			assert.Equal(t, tc.want.Logs, output.Logs)
			assert.Equal(t, tc.want.ErrLogs, output.ErrLogs)
		})
	}
}
