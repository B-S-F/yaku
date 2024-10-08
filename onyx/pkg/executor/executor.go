package executor

import (
	"fmt"
	"strconv"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"go.uber.org/zap"
)

type Output struct {
	ExitCode      int
	Logs          []string
	ErrLogs       []string
	EvidencePath  string
	ExecutionType string
	Status        string
	Reason        string
	Results       []Result
	Outputs       map[string]string
	Name          string
}

type Result struct {
	Criterion     string
	Fulfilled     bool
	Justification string
	Metadata      map[string]string
}

func (o *Output) String() string {
	return fmt.Sprintf("ExitCode: %d, Logs: %v, ErrLogs: %v, EvidencePath: %s, ExecutionType: %s, Status: %s, Reason: %s, Results: %v, Outputs: %v, Name: %s", o.ExitCode, o.Logs, o.ErrLogs, o.EvidencePath, o.ExecutionType, o.Status, o.Reason, o.Results, o.Outputs, o.Name)
}

type Outputter interface {
	Log(logger logger.Logger)
}

func (o *Output) Log(l logger.Logger) {
	logHelper := logger.NewHelper(l)
	if o.ExitCode != 0 {
		logHelper.LogKeyValueIndented("Exit Code:", strconv.Itoa(o.ExitCode))
	}
	if o.Status != "" {
		logHelper.LogKeyValueIndented("Status:", o.Status)
	}
	if o.Reason != "" {
		logHelper.LogKeyValueIndented("Reason:", o.Reason)
	}
	if o.ExecutionType != "" {
		logHelper.LogKeyValueIndented("Execution Type:", o.ExecutionType)
	}
	if o.EvidencePath != "" {
		logHelper.LogKeyValueIndented("Evidence Path:", o.EvidencePath)
	}
	if len(o.Results) != 0 {
		logHelper.LogKeyValueIndented("Results:", "")
		for _, r := range o.Results {
			logHelper.LogKeyValueIndented("- Criteria:", r.Criterion, 4)
			logHelper.LogKeyValueIndented("Fulfilled:", strconv.FormatBool(r.Fulfilled), 6)
			logHelper.LogKeyValueIndented("Justification:", r.Justification, 6)
			logHelper.LogFormatMapIndented("Metadata:", r.Metadata, 6)
		}
	}
	if len(o.Outputs) != 0 {
		logHelper.LogFormatMapIndented("Outputs:", o.Outputs)
	}
	if len(o.Logs) != 0 {
		logHelper.LogKeyValueIndented("Logs:", "")
		for _, line := range o.Logs {
			logHelper.LogKeyValueIndented(line, "", 4)
		}
	}
	if len(o.ErrLogs) != 0 {
		logHelper.LogKeyValueIndented("Error Logs:", "")
		for _, line := range o.ErrLogs {
			logHelper.LogKeyValueIndented(line, "", 4)
		}
	}
}

type Exec struct {
	runner      runner.Runner
	timeout     time.Duration
	rootWorkDir string
	logger      *logger.Autopilot
}

type Executor interface {
	Execute(config *configuration.Item, env, vars, secrets map[string]string) (*Output, error)
}

func (e *Exec) startRunner(workDir string, run string, env, secrets map[string]string) (*runner.Output, error) {
	e.logger.Debug("running", zap.String("workdir", workDir), zap.String("run", run))
	input := runner.Input{
		Cmd:     "/bin/bash",
		Args:    append([]string{"-c"}, "set -e\n"+run),
		Env:     env,
		Secrets: secrets,
		WorkDir: workDir,
	}
	out, err := e.runner.Execute(&input, e.timeout)
	e.logger.Debug("output", zap.Any("output", out), zap.Error(err))
	return out, err
}
