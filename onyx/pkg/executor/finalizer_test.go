//go:build unit
// +build unit

package executor

import (
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"github.com/stretchr/testify/assert"
)

func TestFinalizerOutput(t *testing.T) {
	testCases := map[string]struct {
		given runner.Output
		want  Output
	}{
		"should convert all applicable data to finalizer output": {
			runner.Output{
				ExitCode: 0,
				ErrLogs: []string{
					"error1",
					"error2",
				},
				Logs: []string{
					"log1",
					"log2",
				},
			},
			Output{
				ExitCode: 0,
				ErrLogs: []string{
					"error1",
					"error2",
				},
				Logs: []string{
					"log1",
					"log2",
				},
			},
		},
		"should ignore data that is not applicable to finalizer output": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"reason": "I am a test"},
				},
				ExitCode: 0,
			},
			Output{
				ExitCode: 0,
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			f := NewFinalizer("", 10*time.Minute, logger.NewAutopilot())

			// act
			got := f.output(&tc.given)

			// assert
			assert.Equal(t, &tc.want, got)
		})
	}
}
