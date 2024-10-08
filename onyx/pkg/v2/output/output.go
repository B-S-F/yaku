package output

import (
	"strconv"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
)

type Output struct {
	ExitCode      int
	Logs          []model.LogEntry
	EvidencePath  string
	ExecutionType string
	Status        string
	Reason        string
	Results       []model.Result
	Outputs       map[string]string
	Name          string
}

func (o *Output) Log(l logger.Logger) error {
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
		for _, l := range o.Logs {
			err := logHelper.LogJsonLogEntry(l, 4)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
