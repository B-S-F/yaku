//go:build unit
// +build unit

package executor

import (
	"encoding/json"
	"flag"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"github.com/stretchr/testify/assert"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

func TestAutopilotStoreFiles(t *testing.T) {
	t.Run("should create files and hide secrets both in .env and .secrets", func(t *testing.T) {
		// arrange
		env := map[string]string{
			"FOO":      "bar",
			"PASSWORD": "qux",
			"TOKEN":    "quux",
		}
		varsContent := map[string]string{"some": "var"}
		secretsContent := map[string]string{"password": "qux", "token": "quux"}
		tmpDir := t.TempDir()
		envFile := filepath.Join(tmpDir, ".env")
		varsFile := filepath.Join(tmpDir, ".vars")
		secretsFile := filepath.Join(tmpDir, ".secrets")
		timeout := 10 * time.Minute
		logger := logger.NewAutopilot()
		a := NewAutopilot(false, tmpDir, timeout, logger)

		// act
		logger.Info("test")
		e := a.storeFiles(env, varsContent, secretsContent, tmpDir)

		// assert
		gotEnv, err := os.ReadFile(envFile)
		gotVars, err := os.ReadFile(varsFile)
		gotSecrets, err := os.ReadFile(secretsFile)
		if err != nil {
			t.Fatalf("Failed to read files: %v", err)
		}
		assert.NoError(t, e)
		assert.FileExists(t, envFile)
		assert.FileExists(t, varsFile)
		assert.FileExists(t, secretsFile)
		wantEnv := helper.GoldenValue(t, "env.golden", gotEnv, *update)
		wantVars := helper.GoldenValue(t, "vars.golden", gotVars, *update)
		wantSecrets := helper.GoldenValue(t, "secrets.golden", gotSecrets, *update)
		assert.JSONEq(t, string(wantEnv), string(gotEnv))
		assert.JSONEq(t, string(wantVars), string(gotVars))
		assert.JSONEq(t, string(wantSecrets), string(gotSecrets))
	})
}

func TestAutopilotOutput(t *testing.T) {
	testCases := map[string]struct {
		given runner.Output
		want  Output
	}{
		"should convert all applicable data to output": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"reason": "I am a test"},
					{"result": map[string]interface{}{
						"criterion":     "criteria1",
						"fulfilled":     false,
						"justification": "reason1",
						"metadata": map[string]interface{}{
							"severity": "HIGH",
							"package":  "package1",
						},
					}},
					{"output": map[string]interface{}{
						"a": "b",
						"c": "d",
					}},
					{"output": map[string]interface{}{
						"e": "f",
					}},
					{"unnecessary": "data"},
				},
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
				ExecutionType: "Automation",
				ExitCode:      0,
				ErrLogs: []string{
					"error1",
					"error2",
				},
				Logs: []string{
					"log1",
					"log2",
				},
				Status: "GREEN",
				Reason: "I am a test",
				Results: []Result{
					{
						Criterion:     "criteria1",
						Fulfilled:     false,
						Justification: "reason1",
						Metadata: map[string]string{
							"severity": "HIGH",
							"package":  "package1",
						},
					},
				},
				Outputs: map[string]string{
					"a": "b",
					"c": "d",
					"e": "f",
				},
			},
		},
		"should omit result metadata when not set": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"result": map[string]interface{}{
						"criterion": "finding1",
					}},
				},
				ExitCode: 0,
			},
			Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Status:        "GREEN",
				Results: []Result{
					{
						Criterion: "finding1",
					},
				},
			},
		},
		"should handle empty result metadata": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"result": map[string]interface{}{
						"metadata": map[string]interface{}{},
					}},
				},
				ExitCode: 0,
			},
			Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Status:        "GREEN",
				Results: []Result{
					{
						Metadata: nil,
					},
				},
			},
		},
		"should ignore invalid result metadata": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"result": map[string]interface{}{
						"metadata": "invalid metadata format",
					},
					},
				},
				ExitCode: 0,
			},
			Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Status:        "GREEN",
				Results: []Result{
					{
						Metadata: nil,
					},
				},
			},
		},
		"should handle special result metadata": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"result": map[string]interface{}{
						"metadata": map[string]interface{}{
							"encodedJsonNumber": json.Number("1"),
							"string":            "test",
							"struct": map[string]interface{}{
								"key": "value",
							},
							"bool":        true,
							"date-string": "2021-01-01T00:00:00Z",
							"date":        time.Date(2021, 1, 1, 0, 0, 0, 0, time.UTC),
						},
					}},
				},
				ExitCode: 0,
			},
			Output{
				ExecutionType: "Automation",
				ExitCode:      0,
				Status:        "GREEN",
				Results: []Result{
					{
						Metadata: map[string]string{
							"encodedJsonNumber": "1",
							"string":            "test",
							"struct":            "{\"key\":\"value\"}",
							"bool":              "true",
							"date-string":       "2021-01-01T00:00:00Z",
							"date":              "2021-01-01 00:00:00 +0000 UTC",
						},
					},
				},
			},
		},
		"should also convert multiple properties of a single json line": {
			runner.Output{
				Data: []map[string]interface{}{
					{
						"status": "GREEN",
						"output": map[string]interface{}{
							"a": "b",
							"c": "d",
						},
						"result": map[string]interface{}{
							"criterion":     "finding1",
							"fulfilled":     false,
							"justification": "reason1",
						},
					},
				},
				ExitCode: 0,
				ErrLogs:  []string{},
				Logs:     []string{},
			},
			Output{
				ExecutionType: "Automation",
				Status:        "GREEN",
				Outputs:       map[string]string{"a": "b", "c": "d"},
				Results: []Result{
					{
						Criterion:     "finding1",
						Fulfilled:     false,
						Justification: "reason1",
					},
				},
				ExitCode: 0,
				ErrLogs:  []string{},
				Logs:     []string{},
			},
		},
		"should overwrite outputs with same key": {
			runner.Output{
				Data: []map[string]interface{}{
					{
						"output": map[string]interface{}{
							"a": "b",
							"c": "d",
						},
					},
					{
						"output": map[string]interface{}{
							"c": "f",
						},
					},
				},
				ExitCode: 0,
				ErrLogs:  []string{},
				Logs:     []string{},
			},
			Output{
				Outputs:       map[string]string{"a": "b", "c": "f"},
				ExecutionType: "Automation",
				ExitCode:      0,
				ErrLogs:       []string{},
				Logs:          []string{},
			},
		},
		"should leave not passed data empty": {
			runner.Output{
				Data: []map[string]interface{}{
					{"unnecessary": "data"},
				},
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
				ExecutionType: "Automation",
				ExitCode:      0,
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
		"should ignore invalid data for valid keys": {
			runner.Output{
				Data: []map[string]interface{}{
					{"status": "GREEN"},
					{"result": interface{}("test")},
					{"result": map[string]int{"test": 1}},
					{"result": map[string]bool{"test": true}},
					{"output": interface{}("test")},
					{"output": map[string]int{"test": 1}},
					{"output": map[string]bool{"test": true}},
					{"output": map[string]interface{}{"test": map[string]interface{}{"test": 1}}},
				},
				ExitCode: 0,
			},
			Output{
				ExecutionType: "Automation",
				Status:        "GREEN",
				ExitCode:      0,
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			a := NewAutopilot(false, "", 10*time.Minute, logger.NewAutopilot())

			// act
			got := a.output(&tc.given, "")

			// assert
			assert.Equal(t, &tc.want, got)
		})
	}
}

func TestAutopilotCheckOutput(t *testing.T) {
	testCases := map[string]struct {
		name     string
		given    *Output
		strict   bool
		want     *Output
		wantLogs []string
	}{
		"should set status to ERROR if exit code is non-zero": {
			given: &Output{
				Name:     "test",
				ExitCode: 1,
			},
			strict: true,
			want: &Output{
				Name:     "test",
				ExitCode: 1,
				Status:   "ERROR",
				Reason:   "autopilot 'test' exited with exit code 1",
			},
			wantLogs: []string{"autopilot 'test' exited with exit code 1"},
		},
		"should set status to ERROR if status is empty": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
			},
			strict:   true,
			want:     &Output{Name: "test", ExitCode: 0, Status: "ERROR", Reason: "autopilot 'test' provided an invalid 'status': ''"},
			wantLogs: []string{"autopilot 'test' provided an invalid 'status': ''"},
		},
		"should set status to ERROR if status is not a valid status": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
				Status:   "INVALID",
			},
			strict:   true,
			want:     &Output{Name: "test", ExitCode: 0, Status: "ERROR", Reason: "autopilot 'test' provided an invalid 'status': 'INVALID'"},
			wantLogs: []string{"autopilot 'test' provided an invalid 'status': 'INVALID'"},
		},
		"should set status to ERROR if autopilot reason is empty": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
				Status:   "FAILED",
			},
			strict:   true,
			want:     &Output{Name: "test", ExitCode: 0, Status: "ERROR", Reason: "autopilot 'test' did not provide a 'reason'"},
			wantLogs: []string{"autopilot 'test' did not provide a 'reason'"},
		},
		"should set status to ERROR if results are empty for non-FAILED status": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
				Status:   "GREEN",
				Reason:   "reason",
			},
			strict:   true,
			want:     &Output{Name: "test", ExitCode: 0, Status: "ERROR", Reason: "autopilot 'test' did not provide any 'results'"},
			wantLogs: []string{"autopilot 'test' did not provide any 'results'"},
		},
		"should set status to ERROR if results don't have a criterion or justification": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
				Status:   "YELLOW",
				Reason:   "reason",
				Results: []Result{
					{},
				},
			},
			strict:   true,
			want:     &Output{Name: "test", ExitCode: 0, Status: "ERROR", Reason: "autopilot 'test' did not provide a 'criterion' in result '0'; autopilot 'test' did not provide a 'justification' in result '0'", Results: []Result{{}}},
			wantLogs: []string{"autopilot 'test' did not provide a 'criterion' in result '0'", "autopilot 'test' did not provide a 'justification' in result '0'"},
		},
		"should not set status to ERROR and just log if strict is false": {
			given: &Output{
				Name:     "test",
				ExitCode: 0,
				Status:   "GREEN",
				Reason:   "reason",
			},
			strict:   false,
			want:     &Output{Name: "test", ExitCode: 0, Status: "GREEN", Reason: "reason"},
			wantLogs: []string{"autopilot 'test' did not provide any 'results'"},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			logger := logger.NewAutopilot()
			a := NewAutopilot(false, "", 10*time.Minute, logger)

			// act
			a.checkOutput(tc.given, tc.strict)

			// assert
			assert.Equal(t, tc.want, tc.given)
			for _, wantLog := range tc.wantLogs {
				assert.Contains(t, logger.HumanReadableBuffer.String(), wantLog)
			}
		})
	}
}

func TestCheckItem(t *testing.T) {
	testCases := []struct {
		name  string
		given *configuration.Item
		ok    bool
		want  *Output
	}{
		{
			name: "should return error output if item has validation error",
			given: &configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "test",
				},
				ValidationErr: "validation error",
			},
			ok: false,
			want: &Output{
				Name:          "test",
				ExecutionType: "None",
				Status:        "ERROR",
				Reason:        "autopilot 'test' is invalid and could not be executed: validation error",
			},
		},
		{
			name: "should return nil if item has no validation error",
			given: &configuration.Item{
				Autopilot: configuration.Autopilot{
					Name: "test",
				},
			},
			ok:   true,
			want: nil,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// arrange
			logger := logger.NewAutopilot()
			a := NewAutopilot(false, "", 10*time.Minute, logger)

			// act
			got, ok := a.checkItem(tc.given)

			// assert
			assert.Equal(t, tc.ok, ok)
			assert.Equal(t, tc.want, got)
		})
	}
}
