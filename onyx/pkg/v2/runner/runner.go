package runner

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/B-S-F/onyx/pkg/v2/model"
)

const (
	stdOutSourceType = "stdout"
	stdErrSourceType = "stderr"
)

type Input struct {
	Cmd     string
	Args    []string
	Env     map[string]string
	Secrets map[string]string
	WorkDir string
}

type Output struct {
	JsonData []map[string]interface{}
	WorkDir  string
	Logs     []model.LogEntry
	ExitCode int
}

func (o *Output) parseLogStrings(outStr, errStr string) error {
	outLines := strings.Split(outStr, "\n")
	for _, outLine := range outLines {
		if len(outLine) == 0 {
			continue
		}

		if byteLine := []byte(outLine); json.Valid(byteLine) {
			var jsonLine map[string]interface{}
			decoder := json.NewDecoder(strings.NewReader(outLine))
			decoder.UseNumber()
			_ = decoder.Decode(&jsonLine)
			o.Logs = append(o.Logs, model.LogEntry{Source: stdOutSourceType, Json: jsonLine})
			o.JsonData = append(o.JsonData, jsonLine)
			continue
		}

		o.Logs = append(o.Logs, model.LogEntry{Source: stdOutSourceType, Text: outLine})
	}

	errLines := strings.Split(errStr, "\n")
	for _, errLine := range errLines {
		if len(errLine) == 0 {
			continue
		}

		if byteLine := []byte(errLine); json.Valid(byteLine) {
			var jsonLine map[string]interface{}
			decoder := json.NewDecoder(strings.NewReader(errLine))
			decoder.UseNumber()
			_ = decoder.Decode(&jsonLine)
			o.Logs = append(o.Logs, model.LogEntry{Source: stdErrSourceType, Json: jsonLine})
			continue
		}

		o.Logs = append(o.Logs, model.LogEntry{Source: stdErrSourceType, Text: errLine})
	}

	return nil
}

type Runner interface {
	Execute(input *Input, timeout time.Duration) (*Output, error)
}
