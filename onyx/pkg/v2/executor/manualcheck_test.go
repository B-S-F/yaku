package executor

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestManualExecuteIntegration(t *testing.T) {
	item := &model.ManualCheck{
		Item: model.Item{
			Chapter: configuration.Chapter{
				Id: "chapter",
			},
			Requirement: configuration.Requirement{
				Id: "requirement",
			},
			Check: configuration.Check{
				Id: "check",
			},
		},
		Manual: configuration.Manual{
			Status: "GREEN",
			Reason: "completed manually",
		},
	}
	t.Run("should return output", func(t *testing.T) {
		// arrange
		logger := logger.NewAutopilot()

		// act
		manualExecutor := NewManualExecutor(logger)
		result, err := manualExecutor.Execute(item)

		// assert
		assert.NotNil(t, result)
		assert.NoError(t, err)
		assert.Equal(t, "GREEN", result.Status)
		assert.Equal(t, "completed manually", result.Reason)
	})
}
