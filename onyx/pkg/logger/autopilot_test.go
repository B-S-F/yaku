//go:build unit
// +build unit

package logger

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap/zapcore"
)

func TestNewAutopilot(t *testing.T) {
	t.Run("should init a new logger with default log-level", func(t *testing.T) {
		// act
		autpilotLogger := NewAutopilot()

		// assert
		assert.NotNil(t, autpilotLogger)
		assert.Equal(t, autpilotLogger.consoleLogger.logger.Core().Enabled(zapcore.InfoLevel), true)
		assert.Equal(t, autpilotLogger.jsonLogger.logger.Core().Enabled(zapcore.InfoLevel), true)
	})

	t.Run("should init a new logger with debug log-level", func(t *testing.T) {
		// arrange
		settings := Settings{
			Level: "debug",
		}

		// act
		autopilotLogger := NewAutopilot(settings)

		// assert
		assert.NotNil(t, autopilotLogger)
		assert.Equal(t, autopilotLogger.consoleLogger.logger.Core().Enabled(zapcore.DebugLevel), true)
		assert.Equal(t, autopilotLogger.jsonLogger.logger.Core().Enabled(zapcore.DebugLevel), true)
	})

	t.Run("should add message to human readable and machine readable buffer", func(t *testing.T) {
		// arrange
		log := NewAutopilot()

		// act
		log.Info("test message")

		// assert
		assert.Contains(t, log.String(), "test message")
		assert.Contains(t, log.MachineReadableBuffer.String(), `"msg":"test message"`)
	})

}

func TestToFile(t *testing.T) {
	t.Run("should write logs to file", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		logFile := filepath.Join(tmpDir, "test.log")
		autopilotLogger := NewAutopilot()
		autopilotLogger.SetFiles([]string{logFile})
		autopilotLogger.Info("test message")

		// act
		autopilotLogger.ToFile()

		// assert
		assert.FileExists(t, logFile)
		content, err := os.ReadFile(logFile)
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
	})
	t.Run("should write logs and mask secrets when writing to file", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		logSettings := Settings{
			Secrets: map[string]string{
				"SECRET": "test-secret",
			},
			Files: []string{filepath.Join(tmpDir, "test.log")},
		}
		autopilotLogger := NewAutopilot(logSettings)
		autopilotLogger.Info("test-secret")

		// act
		autopilotLogger.ToFile()

		// assert
		assert.FileExists(t, logSettings.Files[0])
		content, err := os.ReadFile(logSettings.Files[0])
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.NotContains(t, string(content), "test-secret")
		assert.Contains(t, string(content), "***SECRET***")
	})
	t.Run("should write error to logs if file property is not set", func(t *testing.T) {
		// arrange
		log := NewAutopilot()

		// act
		log.ToFile()

		// assert
		assert.Contains(t, log.String(), "no log file specified")
	})
}
