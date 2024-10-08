//go:build unit
// +build unit

package runner

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtractJsonLines(t *testing.T) {
	testCases := map[string]struct {
		input         []string
		wantJsonLines []string
		wantLogLines  []string
	}{
		"should return nil when input is nil": {
			input:         nil,
			wantJsonLines: nil,
			wantLogLines:  nil,
		},
		"should extract json lines": {
			input:         []string{`{"status": "SUCCESS"}`},
			wantJsonLines: []string{`{"status": "SUCCESS"}`},
			wantLogLines:  []string{`{"status": "SUCCESS"}`},
		},
		"should extract log lines when no json": {
			input:         []string{("log")},
			wantJsonLines: nil,
			wantLogLines:  []string{"log"},
		},
		"should extract both json and log lines": {
			input:         []string{`{"status": "SUCCESS"}`, "log"},
			wantJsonLines: []string{`{"status": "SUCCESS"}`},
			wantLogLines:  []string{`{"status": "SUCCESS"}`, "log"},
		},
		"should extract multiple json lines and log lines": {
			input:         []string{`{"status": "SUCCESS"}`, "log", `{"status": "SUCCESS"}`, "log"},
			wantJsonLines: []string{`{"status": "SUCCESS"}`, `{"status": "SUCCESS"}`},
			wantLogLines:  []string{`{"status": "SUCCESS"}`, "log", `{"status": "SUCCESS"}`, "log"},
		},
		"should extract a complex json line": {
			input:         []string{`{"status": "SUCCESS", "outputs": {"a": "b", "c": "d"}}`},
			wantJsonLines: []string{`{"status": "SUCCESS", "outputs": {"a": "b", "c": "d"}}`},
			wantLogLines:  []string{`{"status": "SUCCESS", "outputs": {"a": "b", "c": "d"}}`},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			str := ""
			for _, s := range tc.input {
				str += s + "\n"
			}

			// act
			gotJsonLines, gotLogLines := extractJsonLines(str)

			// assert
			assert.Equal(t, tc.wantJsonLines, gotJsonLines)
			assert.Equal(t, tc.wantLogLines, gotLogLines)
		})
	}
}

func TestParseLogStrings(t *testing.T) {
	testCases := map[string]struct {
		outStr string
		errStr string
		want   *Output
	}{
		"should add to logs, error logs and output data": {
			outStr: "{\"key1\": \"value1\"}\n{\"key2\": \"value2\"}",
			errStr: "error message",
			want: &Output{
				Logs:    []string{`{"key1": "value1"}`, `{"key2": "value2"}`},
				ErrLogs: []string{"error message"},
				Data: []map[string]interface{}{
					{"key1": "value1"},
					{"key2": "value2"},
				},
			},
		},
		"should add json line log to output data": {
			outStr: "{\"key1\": \"value1\"}\n{\"key2\": \"value2\"}",
			errStr: "",
			want: &Output{
				Logs:    []string{`{"key1": "value1"}`, `{"key2": "value2"}`},
				ErrLogs: nil,
				Data: []map[string]interface{}{
					{"key1": "value1"},
					{"key2": "value2"},
				},
			},
		},
		"should decode numbers as json.Number": {
			outStr: "{\"key1\": 1}\n{\"key2\": 2.0}\n{\"key3\": 201872326}\n{\"key4\": 201872326.0}\n{\"key5\": -201872326}\n{\"key6\": -201872326.1}\n{\"key7\": 0}",
			errStr: "",
			want: &Output{
				Logs:    []string{`{"key1": 1}`, `{"key2": 2.0}`, `{"key3": 201872326}`, `{"key4": 201872326.0}`, `{"key5": -201872326}`, `{"key6": -201872326.1}`, `{"key7": 0}`},
				ErrLogs: nil,
				Data: []map[string]interface{}{
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
				Logs:    []string{`{"key1": "2021-01-01T00:00:00Z"}`},
				ErrLogs: nil,
				Data: []map[string]interface{}{
					{"key1": "2021-01-01T00:00:00Z"},
				},
			},
		},
		"should add normal log to logs": {
			outStr: "normal log",
			errStr: "",
			want: &Output{
				Logs:    []string{"normal log"},
				ErrLogs: nil,
				Data:    nil,
			},
		},
		"should add error log to error logs": {
			outStr: "",
			errStr: "error log",
			want: &Output{
				Logs:    nil,
				ErrLogs: []string{"error log"},
				Data:    nil,
			},
		},
		"should not add empty trailing log when newline is last character": {
			outStr: "hello world\n",
			errStr: "hello error world\n",
			want: &Output{
				Logs:    []string{"hello world"},
				ErrLogs: []string{"hello error world"},
				Data:    nil,
			},
		},
		"should return empty output when input is empty": {
			outStr: "",
			errStr: "",
			want: &Output{
				Logs:    nil,
				ErrLogs: nil,
				Data:    nil,
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			out := &Output{}

			// act
			out.parseLogStrings(tc.outStr, tc.errStr)

			// assert
			assert.Equal(t, tc.want, out)
		})
	}
}
