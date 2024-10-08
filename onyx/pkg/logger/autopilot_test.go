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
		log := NewAutopilot()

		// assert
		assert.NotNil(t, log)
		assert.Equal(t, log.Logger.Core().Enabled(zapcore.InfoLevel), true)
	})

	t.Run("should init a new logger with debug log-level", func(t *testing.T) {
		// arrange
		settings := Settings{
			Level: "debug",
		}

		// act
		log := NewAutopilot(settings)

		// assert
		assert.NotNil(t, log)
		assert.Equal(t, log.Logger.Core().Enabled(zapcore.DebugLevel), true)
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
		log := NewAutopilot()
		log.File = filepath.Join(tmpDir, "test.log")
		log.Info("test message")

		// act
		log.ToFile()

		// assert
		assert.FileExists(t, log.File)
		content, err := os.ReadFile(log.File)
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
	})
	t.Run("should write logs and mask secrets when writing to file", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		log := NewAutopilot(Settings{
			Secrets: map[string]string{
				"SECRET": "test-secret",
			},
			File: filepath.Join(tmpDir, "test.log"),
		})
		log.Info("test-secret")

		// act
		log.ToFile()

		// assert
		assert.FileExists(t, log.File)
		content, err := os.ReadFile(log.File)
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
