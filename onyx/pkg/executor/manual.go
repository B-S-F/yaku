package executor

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
)

type Manual struct {
	Exec
}

func NewManual(logger *logger.Autopilot) *Manual {
	exec := Exec{
		runner:      nil,
		rootWorkDir: "",
		logger:      logger,
	}
	return &Manual{
		exec,
	}
}

func (m *Manual) Execute(config *configuration.Item, env, vars, secrets map[string]string) (*Output, error) {
	if config.Autopilot.Name != "" {
		m.logger.Warn(fmt.Sprintf("Check '%s' has both an automation and a manual answer, using the manual answer!", config.Check.Title))
	}
	m.logger.Info("providing manual answer")
	output := m.output(config)
	output.Log(m.logger)
	return output, nil
}

func (m *Manual) output(config *configuration.Item) *Output {
	return &Output{
		ExecutionType: "Manual",
		Status:        config.Manual.Status,
		Reason:        config.Manual.Reason,
	}
}
