package output

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
				Results: []model.Result{
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
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "log line 1"},
					{Source: "stdout", Text: "log line 2"},
					{Source: "stderr", Text: "error log line 1"},
					{Source: "stderr", Text: "error log line 2"},
					{Source: "stdout", Json: map[string]interface{}{"warning": "Your config file will be deprecated next month"}},
				},
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
				"    {\"source\":\"stdout\",\"text\":\"log line 1\"}",
				"    {\"source\":\"stdout\",\"text\":\"log line 2\"}",
				"    {\"source\":\"stderr\",\"text\":\"error log line 1\"}",
				"    {\"source\":\"stderr\",\"text\":\"error log line 2\"}",
				"    {\"source\":\"stdout\",\"json\":{\"warning\":\"Your config file will be deprecated next month\"}}",
			},
		},
		"should log only non-empty fields": {
			output: &Output{
				Status: "RED",
				Outputs: map[string]string{
					"output1": "value1",
				},
				Logs: []model.LogEntry{{Source: "stdout", Text: "log line 1"}},
			},
			want: []string{
				"  Status: RED",
				"  Outputs:",
				"    output1: value1",
				"  Logs:",
				"    {\"source\":\"stdout\",\"text\":\"log line 1\"}",
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
			err := tc.output.Log(observedLogger)
			require.NoError(t, err)
			allLogs := observedLogs.All()
			for _, log := range allLogs {
				assert.Contains(t, tc.want, log.Message)
			}
		})
	}
}
