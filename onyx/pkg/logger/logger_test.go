//go:build unit
// +build unit

package logger

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestLogger(t *testing.T) {
	t.Run("should log messages for all log levels", func(t *testing.T) {
		// arrange
		core, logs := observer.New(zap.DebugLevel)
		log := &Log{
			zap.New(core),
			Settings{},
		}

		// act
		log.Debug("test debug message")
		log.Info("test info message")
		log.Warn("test warn message")
		log.Error("test error message")

		// assert
		got := logs.All()
		assert.Equal(t, 4, logs.Len())
		assert.Equal(t, "test debug message", got[0].Message)
		assert.Equal(t, "test info message", got[1].Message)
		assert.Equal(t, "test warn message", got[2].Message)
		assert.Equal(t, "test error message", got[3].Message)
	})
	t.Run("should hide secrets when logging for all log levels", func(t *testing.T) {
		// arrange
		secrets := map[string]string{
			"TEST_SECRET": "test-secret",
		}
		core, logs := observer.New(zap.DebugLevel)
		log := &Log{
			zap.New(core),
			Settings{
				Secrets: secrets,
			},
		}

		// act
		log.Debug("test-secret")
		log.Info("test-secret")
		log.Warn("test-secret")
		log.Error("test-secret")

		// assert
		got := logs.All()
		assert.Equal(t, 4, logs.Len())
		assert.NotContains(t, got[0].Message, "test-secret")
		assert.NotContains(t, got[1].Message, "test-secret")
		assert.NotContains(t, got[2].Message, "test-secret")
		assert.NotContains(t, got[3].Message, "test-secret")
	})
}
