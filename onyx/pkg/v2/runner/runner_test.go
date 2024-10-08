//go:build unit
// +build unit

package runner

import (
	"encoding/json"
	"testing"

	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

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
