package executor

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/runner"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var nopLogger = &logger.Autopilot{
	Log: logger.Log{
		Logger: zap.NewNop(),
	},
	HumanReadableBuffer:   bytes.NewBuffer(nil),
	MachineReadableBuffer: bytes.NewBuffer(nil),
}

func TestStartRunner(t *testing.T) {
	t.Run("should return correct output", func(t *testing.T) {
		// arrange
		workDir, run := t.TempDir(), "echo 'hello'"
		want := &runner.Output{
			Logs:     []model.LogEntry{{Source: "stdout", Text: "hello"}},
			ExitCode: 0,
			WorkDir:  workDir,
		}
		env, secrets := map[string]string{"env": "value"}, map[string]string{"secret": "value"}
		// act
		output, err := StartRunner(workDir, run, env, secrets, nopLogger, runner.NewSubprocess(nopLogger), 5*time.Minute)
		// assert
		assert.NoError(t, err)
		assert.Equal(t, want, output)
	})
	t.Run("should return error", func(t *testing.T) {
		// arrange
		workDir, run := t.TempDir(), "run"
		want := &runner.Output{
			ExitCode: 127,
			WorkDir:  workDir,
		}
		env, secrets := map[string]string{"env": "value"}, map[string]string{"secret": "value"}
		// act
		output, err := StartRunner(workDir, run, env, secrets, nopLogger, runner.NewSubprocess(nopLogger), 5*time.Minute)
		// assert
		assert.NoError(t, err)
		assert.NotNil(t, output.Logs)
		assert.True(t, strings.Contains(output.Logs[0].Text, "run: command not found"))
		assert.Equal(t, want.ExitCode, output.ExitCode)
		assert.Equal(t, want.WorkDir, output.WorkDir)
	})
}
