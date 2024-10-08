//go:build integration
// +build integration

package executor

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestManualExecuteIntegration(t *testing.T) {
	item := &configuration.Item{
		Chapter: configuration.Chapter{
			Id: "chapter",
		},
		Requirement: configuration.Requirement{
			Id: "requirement",
		},
		Check: configuration.Check{
			Id: "check",
		},
		Manual: configuration.Manual{
			Status: "GREEN",
			Reason: "completed manually",
		},
	}
	t.Run("should return output", func(t *testing.T) {
		// arrange
		logger := logger.NewAutopilot()
		m := NewManual(logger)

		// act
		output, err := m.Execute(item, map[string]string{}, map[string]string{}, map[string]string{})

		// assert
		assert.NotNil(t, output)
		assert.NoError(t, err)
		assert.Equal(t, "Manual", output.ExecutionType)
		assert.Equal(t, "GREEN", output.Status)
		assert.Equal(t, "completed manually", output.Reason)
	})
}
