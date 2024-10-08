package executor

import (
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/output"
)

type ManualExecutor struct {
	logger *logger.Autopilot
}

func NewManualExecutor(logger *logger.Autopilot) *ManualExecutor {
	return &ManualExecutor{logger: logger}
}

func (m *ManualExecutor) Execute(item *model.ManualCheck) (*model.ManualResult, error) {
	m.logger.Info("providing manual answer")
	result := &model.ManualResult{
		Status: item.Manual.Status,
		Reason: item.Manual.Reason,
	}
	output := output.Output{
		Reason: item.Manual.Reason,
		Status: item.Manual.Status,
	}

	err := output.Log(m.logger)
	if err != nil {
		return nil, err
	}

	return result, nil
}
