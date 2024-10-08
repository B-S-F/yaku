//go:build unit
// +build unit

package executor

import (
	"bytes"
	"errors"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestOutputLog(t *testing.T) {
	testCases := map[string]struct {
		output *Output
		want   []string
	}{
		"should log all fields": {
			output: &Output{
				ExitCode:      1,
				Status:        "GREEN",
				Reason:        "some reason",
				ExecutionType: "some type",
				EvidencePath:  "/path/to/evidence",
				Results: []Result{
					{
						Criterion:     "some criterion",
						Fulfilled:     true,
						Justification: "some justification",
						Metadata: map[string]string{
							"key1": "value1",
							"key2": "value2",
						},
					},
				},
				Outputs: map[string]string{
					"output1": "value1",
					"output2": "value2",
				},
				Logs:    []string{"log line 1", "log line 2"},
				ErrLogs: []string{"error log line 1", "error log line 2"},
			},
			want: []string{
				"  Exit Code: 1",
				"  Status: GREEN",
				"  Reason: some reason",
				"  Execution Type: some type",
				"  Evidence Path: /path/to/evidence",
				"  Results:",
				"    - Criteria: some criterion",
				"      Fulfilled: true",
				"      Justification: some justification",
				"      Metadata:",
				"        key1: value1",
				"        key2: value2",
				"  Outputs:",
				"    output1: value1",
				"    output2: value2",
				"  Logs:",
				"    log line 1",
				"    log line 2",
				"  Error Logs:",
				"    error log line 1",
				"    error log line 2",
			},
		},
		"should log only non-empty fields": {
			output: &Output{
				Status: "RED",
				Outputs: map[string]string{
					"output1": "value1",
				},
				Logs: []string{"log line 1"},
			},
			want: []string{
				"  Status: RED",
				"  Outputs:",
				"    output1: value1",
				"  Logs:",
				"    log line 1",
			},
		},
		"should not log anything if all fields are empty": {
			output: &Output{},
			want:   []string{},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			observedZapCore, observedLogs := observer.New(zap.InfoLevel)
			observedLogger := &logger.Log{
				Logger: zap.New(observedZapCore),
			}
			tc.output.Log(observedLogger)
			allLogs := observedLogs.All()
			for _, log := range allLogs {
				assert.Contains(t, tc.want, log.Message)
			}
		})
	}
}

var nopLogger = &logger.Autopilot{
	Log: logger.Log{
		Logger: zap.NewNop(),
	},
	HumanReadableBuffer:   bytes.NewBuffer(nil),
	MachineReadableBuffer: bytes.NewBuffer(nil),
}

type mockRunner struct {
	mock.Mock
}

func (m *mockRunner) Execute(input *runner.Input, timeout time.Duration) (*runner.Output, error) {
	args := m.Called(input, timeout)
	return args.Get(0).(*runner.Output), args.Error(1)
}

func TestStartRunner(t *testing.T) {
	exec := &Exec{
		runner:  &mockRunner{},
		timeout: 10 * time.Second,
		logger:  nopLogger,
	}
	t.Run("should return output", func(t *testing.T) {
		// arrange
		workDir, run := "workDir", "run"
		output := &runner.Output{
			ExitCode: 0,
			WorkDir:  workDir,
		}
		_ = exec.runner.(*mockRunner).On("Execute", mock.Anything, mock.Anything).Return(output, nil).Once()
		env, secrets := map[string]string{"env": "value"}, map[string]string{"secret": "value"}
		// act
		want, err := exec.startRunner(workDir, run, env, secrets)
		// assert
		assert.NoError(t, err)
		assert.Equal(t, output, want)
	})
	t.Run("should return error", func(t *testing.T) {
		// arrange
		workDir, run := "workDir", "run"
		output := &runner.Output{
			ExitCode: 1,
			WorkDir:  workDir,
		}
		env, secrets := map[string]string{"env": "value"}, map[string]string{"secret": "value"}
		_ = exec.runner.(*mockRunner).On("Execute", mock.Anything, mock.Anything).Return(output, errors.New("mock error")).Once()
		// act
		_, err := exec.startRunner(workDir, run, env, secrets)

		// assert
		assert.Error(t, err)
	})
}
