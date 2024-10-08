package logger

import (
	"os"

	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type Common struct {
	Log
}

func NewCommon(s ...Settings) *Common {
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
	var core zapcore.Core

	if settings.File != "" {
		jsonEncoderConfig := zap.NewProductionEncoderConfig()
		jsonEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		jsonEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
		jsonEncoder := zapcore.NewJSONEncoder(jsonEncoderConfig)
		fileLogging := zapcore.Lock(zapcore.AddSync(&lumberjack.Logger{
			Filename:   settings.File,
			MaxSize:    10, // megabytes
			MaxBackups: 3,
			MaxAge:     28, // days
		}))
		core = zapcore.NewTee(
			zapcore.NewCore(consoleEncoder, consoleLogging, level),
			zapcore.NewCore(jsonEncoder, fileLogging, level),
		)
	} else {
		core = zapcore.NewCore(consoleEncoder, consoleLogging, level)
	}
	return &Common{
		Log{
			zap.New(core),
			settings,
		},
	}
}
