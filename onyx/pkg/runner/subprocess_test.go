//go:build unit
// +build unit

package runner

import (
	"os"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var nopLogger = &logger.Log{
	Logger: zap.NewNop(),
}

func TestExecute(t *testing.T) {
	tmpDir := t.TempDir()
	testCases := map[string]struct {
		input   *Input
		timeout time.Duration
		want    *Output
	}{
		"should return output with logs": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo hello world"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     []string{"hello world"},
				ErrLogs:  nil,
				ExitCode: 0,
				WorkDir:  tmpDir,
			},
		},
		"should return output with error logs": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "1>&2 echo hello world"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     nil,
				ErrLogs:  []string{"hello world"},
				ExitCode: 0,
				WorkDir:  tmpDir,
			},
		},
		"should return exit code": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "exit 1"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     nil,
				ErrLogs:  nil,
				ExitCode: 1,
				WorkDir:  tmpDir,
			},
		},
		"should hide secrets in output logs": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo secret1"},
				WorkDir: tmpDir,
				Secrets: map[string]string{
					"SECRET1": "secret1",
					"SECRET2": "secret2",
				},
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:    []string{"***SECRET1***"},
				ErrLogs: nil,
				Data:    nil,
				WorkDir: tmpDir,
			},
		},
		"should hide secrets in error logs": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "1>&2 echo secret1"},
				WorkDir: tmpDir,
				Secrets: map[string]string{
					"SECRET1": "secret1",
					"SECRET2": "secret2",
				},
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:    nil,
				ErrLogs: []string{"***SECRET1***"},
				Data:    nil,
				WorkDir: tmpDir,
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			s := &Subprocess{
				logger: nopLogger,
			}
			// act
			output, err := s.Execute(tc.input, tc.timeout)
			// assert
			assert.NoError(t, err)
			assert.Equal(t, tc.want, output)
		})
	}

	badTestBases := map[string]struct {
		cmd      string
		args     []string
		exitCode int
	}{
		"should return exit code -1 for unknown command": {
			cmd:      "nonexistent",
			args:     nil,
			exitCode: -1,
		},
		"should timeout and return exit code 124": {
			cmd:      "/bin/bash",
			args:     []string{"-c", "sleep 1"},
			exitCode: 124,
		},
	}
	for name, tc := range badTestBases {
		t.Run(name, func(t *testing.T) {
			// arrange
			s := &Subprocess{
				logger: nopLogger,
			}
			input := &Input{
				Cmd:     tc.cmd,
				Args:    tc.args,
				WorkDir: tmpDir,
			}
			// act
			out, err := s.Execute(input, 10*time.Millisecond)
			// assert
			assert.NoError(t, err)
			assert.Equal(t, tc.exitCode, out.ExitCode)
		})
	}
}

func TestInitCommand(t *testing.T) {
	s := &Subprocess{
		logger: nopLogger,
	}
	timeout := 1 * time.Second
	cmd, args := "echo", []string{"hello"}

	t.Run("should return a command with workdir set", func(t *testing.T) {
		// arrange
		workDir := "/tmp"
		input := &Input{
			Cmd:     cmd,
			Args:    args,
			WorkDir: workDir,
		}
		// act
		result, _, _ := s.initCommand(input, timeout)
		// assert
		assert.Equal(t, workDir, result.Dir)
	})

	t.Run("should return a command with system env set", func(t *testing.T) {
		// arrange
		input := &Input{
			Cmd:  cmd,
			Args: args,
		}
		// act
		result, _, _ := s.initCommand(input, timeout)
		// assert
		assert.Equal(t, os.Environ(), result.Env)
	})
	t.Run("should return a command with env set", func(t *testing.T) {
		// arrange
		env := map[string]string{"key": "value"}
		input := &Input{
			Cmd:  cmd,
			Args: args,
			Env:  env,
		}
		// act
		result, _, _ := s.initCommand(input, timeout)
		// assert
		assert.Contains(t, result.Env, "key=value")
	})
	t.Run("should return a command with timeout set", func(t *testing.T) {
		// arrange
		input := &Input{
			Cmd:  cmd,
			Args: args,
		}
		// act
		_, ctx, cancel := s.initCommand(input, timeout)
		// assert
		assert.NotNil(t, ctx)
		assert.NotNil(t, cancel)
	})
}

func TestRunCommand(t *testing.T) {
	s := &Subprocess{
		logger: nopLogger,
	}
	testCases := map[string]struct {
		exitCode int
		sleep    string
	}{
		"should return exit code 0 when command finishes before timeout": {
			exitCode: 0,
			sleep:    "0",
		},
		"should return exit code 124 when command doesn't finish before timeout": {
			exitCode: 124,
			sleep:    "1",
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			input := &Input{
				Cmd:  "sleep",
				Args: []string{tc.sleep},
			}
			cmd, ctx, cancel := s.initCommand(input, 100*time.Millisecond)
			defer cancel()
			// act
			exitCode := s.runCommand(cmd, ctx)
			// assert
			assert.Equal(t, tc.exitCode, exitCode)
		})
	}
}

// func TestParseOutput(t *testing.T) {
// 	s := &Subprocess{
// 		logger: nopLogger,
// 	}
// 	workDir := "/tmp"
// 	secrets := map[string]string{"secret": "value"}

// 	testCases := map[string]struct {
// 		name     string
// 		input    *Input
// 		exitCode int
// 		stdout   bytes.Buffer
// 		stderr   bytes.Buffer
// 		want     *Output
// 	}{
// 		"should return output without logs": {
// 			input:    &Input{WorkDir: workDir, Secrets: secrets},
// 			exitCode: 0,
// 			stdout:   bytes.Buffer{},
// 			stderr:   bytes.Buffer{},
// 			want: &Output{
// 				WorkDir:  workDir,
// 				ExitCode: 0,
// 			},
// 		},
// 		"should return output with logs and error logs": {
// 			input:    &Input{WorkDir: workDir, Secrets: secrets},
// 			exitCode: 2,
// 			stdout:   *bytes.NewBufferString("output"),
// 			stderr:   *bytes.NewBufferString("error"),
// 			want: &Output{
// 				WorkDir:  workDir,
// 				ExitCode: 2,
// 				Logs:     []string{"output"},
// 				ErrLogs:  []string{"error"},
// 			},
// 		},
// 	}

// 	for name, tc := range testCases {
// 		t.Run(name, func(t *testing.T) {
// 			// act
// 			result := s.parseOutput(tc.input, tc.exitCode, tc.stdout, tc.stderr)
// 			// assert
// 			assert.Equal(t, tc.want, result)
// 		})
// 	}
// }
