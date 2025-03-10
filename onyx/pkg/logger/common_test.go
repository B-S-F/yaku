// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

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

func TestNewCommon(t *testing.T) {
	t.Run("should init a new logger with default log-level", func(t *testing.T) {
		// act
		log := NewConsoleFileLogger()

		// assert
		assert.NotNil(t, log)
		assert.True(t, log.consoleLogger.logger.Core().Enabled(zapcore.InfoLevel))
	})

	t.Run("should init a new logger with debug log-level", func(t *testing.T) {
		// arrange
		settings := Settings{
			Level: "debug",
		}

		// act
		log := NewConsoleFileLogger(settings)

		// assert
		assert.NotNil(t, log)
		assert.True(t, log.consoleLogger.logger.Core().Enabled(zapcore.DebugLevel), true)
	})
	t.Run("should init a new logger with logging to file enabled", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		settings := Settings{
			Files: []string{filepath.Join(tmpDir, "test.log")},
		}

		// act
		log := NewConsoleFileLogger(settings)
		log.Info("test message")

		// assert
		assert.NotNil(t, log)
		assert.FileExists(t, settings.Files[0])
		content, err := os.ReadFile(log.fileLogger.Files[0])
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.Contains(t, string(content), "test message")
	})

	t.Run("should not log secrets to file", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		settings := Settings{
			Files: []string{filepath.Join(tmpDir, "test.log")},
			Secrets: map[string]string{
				"SECRET": "test-secret",
			},
		}

		// act
		log := NewConsoleFileLogger(settings)
		log.Info("test-secret")

		// assert
		assert.FileExists(t, settings.Files[0])
		content, err := os.ReadFile(log.fileLogger.Files[0])
		if err != nil {
			t.Fatalf("Failed to open file: %v", err)
		}
		assert.NotContains(t, "test-secret", string(content))
		assert.Contains(t, string(content), "***SECRET***")
	})
}
