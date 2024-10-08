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
		logger := NewAutopilot(Settings{
			Secrets: map[string]string{
				"SECRETS": "test-secret",
			},
		})

		// act
		logger.Info("test message")
		logger.Info("test-secret")
		logger.Flush()
		logger.File = filepath.Join(tmpDir, "test.log")
		logger.ToFile()

		// assert
		assert.Contains(t, logger.String(), "test message")
		assert.NotContains(t, logger.String(), "test-secret")
		assert.FileExists(t, logger.File)
		content, err := os.ReadFile(logger.File)
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
		logger := NewCommon(Settings{
			File: filepath.Join(tmpDir, "test.log"),
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
		assert.FileExists(t, logger.File)
		content, err := os.ReadFile(logger.File)
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
		assert.NotContains(t, string(content), "test-secret")
	})
}
