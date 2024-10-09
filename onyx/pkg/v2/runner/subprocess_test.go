//go:build unit
// +build unit

package runner

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/netflix/go-iomux"
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
				Logs:     []model.LogEntry{{Source: "stdout", Text: "hello world"}},
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
				Logs:     []model.LogEntry{{Source: "stderr", Text: "hello world"}},
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
				Logs:     []model.LogEntry{{Source: "stdout", Text: "***SECRET1***"}},
				JsonData: nil,
				WorkDir:  tmpDir,
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
				Logs:     []model.LogEntry{{Source: "stderr", Text: "***SECRET1***"}},
				JsonData: nil,
				WorkDir:  tmpDir,
			},
		},
		"should hide secrets in json data": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo '{\"key1\": \"secret1\"}'"},
				WorkDir: tmpDir,
				Secrets: map[string]string{
					"SECRET1": "secret1",
					"SECRET2": "secret2",
				},
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stdout", Json: map[string]interface{}{"key1": "***SECRET1***"}}},
				JsonData: []map[string]interface{}{{"key1": "***SECRET1***"}},
				WorkDir:  tmpDir,
			},
		},
		"should return standard error and standard output in the correct order": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo hello world1; 1>&2 echo hello world2; echo hello world3; echo hello world4; 1>&2 echo hello world5; 1>&2 echo hello world6"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "hello world1"},
					{Source: "stderr", Text: "hello world2"},
					{Source: "stdout", Text: "hello world3"},
					{Source: "stdout", Text: "hello world4"},
					{Source: "stderr", Text: "hello world5"},
					{Source: "stderr", Text: "hello world6"},
				},
				ExitCode: 0,
				WorkDir:  tmpDir,
			},
		},
		"should handle interleaved standard error and standard output": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo -n hello; 1>&2 echo hello world; echo world;"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stderr", Text: "hello world"}, {Source: "stdout", Text: "helloworld"}},
				ExitCode: 0,
				WorkDir:  tmpDir,
			},
		},
		"should handle missing newline at the end of logs": {
			input: &Input{
				Cmd:     "/bin/bash",
				Args:    []string{"-c", "echo -n hello; 1>&2 echo -n hello world; echo -n world;"},
				WorkDir: tmpDir,
			},
			timeout: 10 * time.Minute,
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stdout", Text: "helloworld"}, {Source: "stderr", Text: "hello world"}},
				ExitCode: 0,
				WorkDir:  tmpDir,
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

func TestDemuxLogs(t *testing.T) {
	s := &Subprocess{
		logger: nopLogger,
	}

	testCases := map[string]struct {
		outStr string
		errStr string
		want   *Output
	}{
		"should add to logs, error logs and output data": {
			outStr: "{\"key1\": \"value1\"}\n{\"key2\": \"value2\"}",
			errStr: "error message",
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Json: map[string]interface{}{"key1": "value1"}},
					{Source: "stdout", Json: map[string]interface{}{"key2": "value2"}},
					{Source: "stderr", Text: "error message"},
				},
				JsonData: []map[string]interface{}{
					{"key1": "value1"},
					{"key2": "value2"},
				},
			},
		},
		"should add json line log to output data": {
			outStr: "{\"key1\": \"value1\"}\n{\"key2\": \"value2\"}",
			errStr: "",
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Json: map[string]interface{}{"key1": "value1"}},
					{Source: "stdout", Json: map[string]interface{}{"key2": "value2"}},
				},
				JsonData: []map[string]interface{}{
					{"key1": "value1"},
					{"key2": "value2"},
				},
			},
		},
		"should decode numbers as json.Number": {
			outStr: "{\"key1\": 1}\n{\"key2\": 2.0}\n{\"key3\": 201872326}\n{\"key4\": 201872326.0}\n{\"key5\": -201872326}\n{\"key6\": -201872326.1}\n{\"key7\": 0}",
			errStr: "",
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Json: map[string]interface{}{"key1": json.Number("1")}},
					{Source: "stdout", Json: map[string]interface{}{"key2": json.Number("2.0")}},
					{Source: "stdout", Json: map[string]interface{}{"key3": json.Number("201872326")}},
					{Source: "stdout", Json: map[string]interface{}{"key4": json.Number("201872326.0")}},
					{Source: "stdout", Json: map[string]interface{}{"key5": json.Number("-201872326")}},
					{Source: "stdout", Json: map[string]interface{}{"key6": json.Number("-201872326.1")}},
					{Source: "stdout", Json: map[string]interface{}{"key7": json.Number("0")}},
				},
				JsonData: []map[string]interface{}{
					{"key1": json.Number("1")},
					{"key2": json.Number("2.0")},
					{"key3": json.Number("201872326")},
					{"key4": json.Number("201872326.0")},
					{"key5": json.Number("-201872326")},
					{"key6": json.Number("-201872326.1")},
					{"key7": json.Number("0")},
				},
			},
		},
		"should treat dates as string": {
			outStr: "{\"key1\": \"2021-01-01T00:00:00Z\"}",
			errStr: "",
			want: &Output{
				Logs: []model.LogEntry{{Source: "stdout", Json: map[string]interface{}{"key1": "2021-01-01T00:00:00Z"}}},
				JsonData: []map[string]interface{}{
					{"key1": "2021-01-01T00:00:00Z"},
				},
			},
		},
		"should add normal log to logs": {
			outStr: "normal log",
			errStr: "",
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stdout", Text: "normal log"}},
				JsonData: nil,
			},
		},
		"should add error log to logs with source stderr": {
			outStr: "",
			errStr: "error log",
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stderr", Text: "error log"}},
				JsonData: nil,
			},
		},
		"should add json error log to logs with source stderr": {
			outStr: "",
			errStr: "{\"context\":\"some-context\", \"errMsg\":\"err-msg\"}",
			want: &Output{
				Logs:     []model.LogEntry{{Source: "stderr", Json: map[string]interface{}{"context": "some-context", "errMsg": "err-msg"}}},
				JsonData: nil,
			},
		},
		"should not add empty trailing log when newline is last character": {
			outStr: "hello world\n",
			errStr: "hello error world\n",
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "hello world"},
					{Source: "stderr", Text: "hello error world"},
				},
				JsonData: nil,
			},
		},
		"should return empty output when input is empty": {
			outStr: "",
			errStr: "",
			want: &Output{
				Logs:     nil,
				JsonData: nil,
			},
		},
		"should skip empty log lines": {
			outStr: "hello\n\nworld\n",
			errStr: "hello\n\n\n\nerror\n\nworld\n",
			want: &Output{
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "hello"},
					{Source: "stdout", Text: "world"},
					{Source: "stderr", Text: "hello"},
					{Source: "stderr", Text: "error"},
					{Source: "stderr", Text: "world"},
				},
				JsonData: nil,
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			out := &Output{}
			mux := iomux.NewMuxUnixGram[string]()
			stdout, _ := mux.Tag(stdOutSourceType)
			stderr, _ := mux.Tag(stdErrSourceType)
			ctx, cancel := context.WithCancel(context.Background())
			go func() {
				stdout.WriteString(tc.outStr)
				stdout.Close()
				stderr.WriteString(tc.errStr)
				stderr.Close()
				cancel()
			}()

			// act
			chunks, err := mux.ReadUntil(ctx)
			s.demuxLogs(&Input{}, out, chunks)

			// assert
			if assert.NoError(t, err) {
				assert.Equal(t, tc.want, out)
			}

			// cleanup
			mux.Close()
		})
	}
}
