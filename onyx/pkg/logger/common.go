// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package logger

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type ConsoleFileLogger struct {
	consoleLogger HideSecretsLog
	fileLogger    HideSecretsLog
}

func NewConsoleFileLogger(s ...Settings) *ConsoleFileLogger {
	settings := Settings{}
	if len(s) > 0 {
		settings = s[0]
	}
	if settings.Level == "" {
		settings.Level = viper.GetString("log-level")
	}
	level, _ := zapcore.ParseLevel(settings.Level)
	var timeKey string
	if level != zap.InfoLevel {
		timeKey = "time"
	}
	ENCODER_CONFIG = zapcore.EncoderConfig{
		MessageKey:     "message",
		LevelKey:       "level",
		TimeKey:        timeKey,
		NameKey:        "name",
		CallerKey:      "caller",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
	consoleEncoder := zapcore.NewConsoleEncoder(ENCODER_CONFIG)
	consoleLogging := zapcore.Lock(zapcore.AddSync(os.Stdout))

	var fileCores []zapcore.Core
	for _, file := range settings.Files {
		jsonEncoderConfig := zap.NewProductionEncoderConfig()
		jsonEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		jsonEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
		jsonEncoder := zapcore.NewJSONEncoder(jsonEncoderConfig)
		fileLogging := zapcore.Lock(zapcore.AddSync(&lumberjack.Logger{
			Filename:   file,
			MaxSize:    10, // megabytes
			MaxBackups: 3,
			MaxAge:     28, // days
		}))
		fileCores = append(fileCores, zapcore.NewCore(jsonEncoder, fileLogging, level))
	}

	return &ConsoleFileLogger{
		consoleLogger: HideSecretsLog{
			logger:   zap.New(zapcore.NewCore(consoleEncoder, consoleLogging, level)),
			Settings: settings,
		},
		fileLogger: HideSecretsLog{
			logger:   zap.New(zapcore.NewTee(fileCores...)),
			Settings: settings,
		},
	}
}

func (c *ConsoleFileLogger) Debug(msg string, fields ...zap.Field) {
	c.consoleLogger.Debug(msg, fields...)
	c.fileLogger.Debug(msg, fields...)
}

func (c *ConsoleFileLogger) Debugf(msg string, args ...interface{}) {
	c.consoleLogger.Debugf(msg, args...)
	c.fileLogger.Debugf(msg, args...)
}

func (c *ConsoleFileLogger) Info(msg string, fields ...zap.Field) {
	c.consoleLogger.Info(msg, fields...)
	c.fileLogger.Info(msg, fields...)
}

func (c *ConsoleFileLogger) Infof(msg string, args ...interface{}) {
	c.consoleLogger.Infof(msg, args...)
	c.fileLogger.Infof(msg, args...)
}

func (c *ConsoleFileLogger) Warn(msg string, fields ...zap.Field) {
	c.consoleLogger.Warn(msg, fields...)
	c.fileLogger.Warn(msg, fields...)
}

func (c *ConsoleFileLogger) Warnf(msg string, args ...interface{}) {
	c.consoleLogger.Warnf(msg, args...)
	c.fileLogger.Warnf(msg, args...)
}

func (c *ConsoleFileLogger) Error(msg string, fields ...zap.Field) {
	zapFields := []zap.Field{zap.String("category", "SYSTEM")}
	zapFields = append(zapFields, fields...)
	c.consoleLogger.Error(msg, fields...)
	c.fileLogger.Error(msg, zapFields...)
}

func (c *ConsoleFileLogger) Errorf(msg string, args ...interface{}) {
	zapField := zap.String("category", "SYSTEM")
	c.consoleLogger.Errorf(msg, args...)
	c.fileLogger.Error(fmt.Sprintf(msg, args...), zapField)
}

func (c *ConsoleFileLogger) UserError(msg string, fields ...zap.Field) {
	zapFields := []zap.Field{zap.String("category", "USER")}
	zapFields = append(zapFields, fields...)
	c.consoleLogger.Warn(msg, fields...)
	c.fileLogger.Error(msg, zapFields...)
}

func (c *ConsoleFileLogger) UserErrorf(msg string, args ...interface{}) {
	c.consoleLogger.Warnf(msg, args...)
	c.fileLogger.Error(fmt.Sprintf(msg, args...), zap.String("category", "USER"))
}
