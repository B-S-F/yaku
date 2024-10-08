//go:build integration
// +build integration

package finalize

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/stretchr/testify/assert"
)

func TestEngine_Run(t *testing.T) {
	env := map[string]string{
		"baz": "qux",
	}
	secrets := map[string]string{
		"TEST_SECRET": "test_secret",
	}

	testCases := map[string]struct {
		item       *configuration.Item
		wantOutput *executor.Output
		wantLogs   []string
		wantError  bool
	}{

		"should return item result": {
			item: &configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "autopilot",
					Run:  "echo 'hello world'",
					Env: map[string]string{
						"foo": "bar",
					},
				},
			},
			wantOutput: &executor.Output{
				Logs:     []string{"hello world"},
				ErrLogs:  nil,
				ExitCode: 0,
			},
			wantLogs: []string{
				"info\t  Evidence Path:",
				"info\t  Logs:",
				"info\t    hello world",
			},
			wantError: false,
		},
		"should return result if run fails": {
			item: &configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "autopilot",
					Run:  "echo 'hello world' && exit 1",
				},
			},
			wantOutput: &executor.Output{
				Logs:     []string{"hello world"},
				ErrLogs:  nil,
				ExitCode: 1,
			},
			wantLogs:  nil,
			wantError: true,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			engine := NewEngine(tmpDir, 10*time.Minute)

			// act
			got, err := engine.Run(tc.item, env, secrets)

			// assert
			assert.NotNil(t, got)
			assert.NoError(t, err)
			assert.Equal(t, tc.item, got.Config)
			assert.Equal(t, tc.wantOutput.ExitCode, got.Output.ExitCode)
			assert.Equal(t, tc.wantOutput.Logs, got.Output.Logs)
			assert.Equal(t, tc.wantOutput.ErrLogs, got.Output.ErrLogs)
			for _, log := range tc.wantLogs {
				assert.Contains(t, got.Logs.String(), log)
			}
		})
	}
}
