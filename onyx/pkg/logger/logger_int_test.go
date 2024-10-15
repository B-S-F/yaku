//go:build integration
// +build integration

package logger

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

func TestLoggerIntegration(t *testing.T) {
	t.Run("should create a autopilot logger", func(t *testing.T) {
		// arrange
		viper.Set("log_level", "info")
		tmpDir := t.TempDir()
		autopilotLog := NewAutopilot(Settings{
			Secrets: map[string]string{
				"SECRETS": "test-secret",
			},
		})
		logFile := filepath.Join(tmpDir, "test.log")

		// act
		autopilotLog.Info("test message")
		autopilotLog.Info("test-secret")
		autopilotLog.Flush()
		autopilotLog.SetFiles([]string{logFile})
		autopilotLog.ToFile()

		// assert
		assert.Contains(t, autopilotLog.String(), "test message")
		assert.NotContains(t, autopilotLog.String(), "test-secret")
		assert.FileExists(t, logFile)
		content, err := os.ReadFile(logFile)
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
		assert.NotContains(t, string(content), "test-secret")
	})

	t.Run("should set a common logger as default logger", func(t *testing.T) {
		// arrange
		viper.Set("log_level", "info")
		tmpDir := t.TempDir()
		logFile := filepath.Join(tmpDir, "test.log")
		logger := NewConsoleFileLogger(Settings{
			Files: []string{logFile},
			Secrets: map[string]string{
				"SECRETS": "test-secret",
			},
		})
		Set(logger)

		// act
		log := Get()
		log.Info("test message")
		log.Info("test-secret")

		// assert
		assert.FileExists(t, logFile)
		content, err := os.ReadFile(logFile)
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
		assert.NotContains(t, string(content), "test-secret")
	})
}
