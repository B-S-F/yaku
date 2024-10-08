//go:build unit
// +build unit

package executor

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/stretchr/testify/assert"
)

func TestManualOutput(t *testing.T) {
	// arrange
	manual := Manual{}
	config := &configuration.Item{
		Manual: configuration.Manual{
			Status: "GREEN",
			Reason: "completed manually",
		},
	}

	// act
	output := manual.output(config)

	// assert
	assert.Equal(t, "Manual", output.ExecutionType)
	assert.Equal(t, "GREEN", output.Status)
	assert.Equal(t, "completed manually", output.Reason)
}
