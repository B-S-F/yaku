//go:build integration
// +build integration

package runner

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestRunnerIntegration(t *testing.T) {
	tmpDir := t.TempDir()
	testCases := map[string]struct {
		input   *Input
		want    *Output
		timeout time.Duration
	}{
		"should execute a subprocess runner": {
			input: &Input{
				Cmd:  "/bin/bash",
				Args: append([]string{"-c"}, "set -e\n"+"echo hello world\necho $ENV1\necho secret1"),
				Env: map[string]string{
					"ENV1": "env1",
				},
				Secrets: map[string]string{
					"SECRET1": "secret1",
				},
				WorkDir: tmpDir,
			},
			want: &Output{
				Logs:     []string{"hello world", "env1", "***SECRET1***"},
				ErrLogs:  nil,
				ExitCode: 0,
				WorkDir:  tmpDir,
			},
			timeout: 1 * time.Second,
		},
		"should timeout when a subprocess runner takes too long": {
			input: &Input{
				Cmd:  "/bin/bash",
				Args: append([]string{"-c"}, "set -e\n"+"sleep 1"),
				Env: map[string]string{
					"ENV1": "env1",
				},
				Secrets: map[string]string{
					"SECRET1": "secret1",
				},
				WorkDir: tmpDir,
			},
			want: &Output{
				Logs:     nil,
				ErrLogs:  []string{"Command timed out after 10ms"},
				ExitCode: 124,
				WorkDir:  tmpDir,
			},
			timeout: 10 * time.Millisecond,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			r := NewSubprocess(logger.NewAutopilot())
			// act
			got, err := r.Execute(tc.input, tc.timeout)
			// assert
			assert.NoError(t, err)
			assert.Equal(t, tc.want, got)
		})
	}
}
