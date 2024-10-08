package runner

import (
	"encoding/json"
	"strings"
	"time"
)

type Input struct {
	Cmd     string
	Args    []string
	Env     map[string]string
	Secrets map[string]string
	WorkDir string
}

type Output struct {
	Data     []map[string]interface{} `json:"data"`
	WorkDir  string
	Logs     []string `json:"logs"`
	ErrLogs  []string `json:"err_logs"`
	ExitCode int      `json:"exit_code"`
}

func (o *Output) parseLogStrings(outStr, errStr string) {
	jsonLines, logs := extractJsonLines(outStr)
	o.Logs = logs
	if len(errStr) > 0 {
		o.ErrLogs = strings.Split(errStr, "\n")
		if o.ErrLogs[len(o.ErrLogs)-1] == "" {
			o.ErrLogs = o.ErrLogs[:len(o.ErrLogs)-1]
		}
	}
	for _, line := range jsonLines {
		var lineData map[string]interface{}
		decoder := json.NewDecoder(strings.NewReader(line))
		decoder.UseNumber()
		_ = decoder.Decode(&lineData)
		o.Data = append(o.Data, lineData)
	}
}

func extractJsonLines(str string) (jsonLines []string, logLines []string) {
	lines := strings.Split(str, "\n")
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		if json.Valid([]byte(line)) {
			jsonLines = append(jsonLines, string(line))
		}
		logLines = append(logLines, string(line))
	}
	return
}

type Runner interface {
	Execute(input *Input, timeout time.Duration) (*Output, error)
}
