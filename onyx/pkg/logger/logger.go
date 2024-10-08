package logger

import (
	"github.com/B-S-F/onyx/pkg/helper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger Logger

var ENCODER_CONFIG zapcore.EncoderConfig

func init() {
	logger = NewCommon()
}

type Settings struct {
	Level   string
	File    string
	Secrets map[string]string
}

type Log struct {
	Logger *zap.Logger
	Settings
}

type Logger interface {
	Debug(msg string, fields ...zap.Field)
	Debugf(msg string, args ...interface{})
	Info(msg string, fields ...zap.Field)
	Infof(msg string, args ...interface{})
	Warn(msg string, fields ...zap.Field)
	Warnf(msg string, args ...interface{})
	Error(msg string, fields ...zap.Field)
	Errorf(msg string, args ...interface{})
}

func (l *Log) Debug(msg string, fields ...zap.Field) {
	l.Logger.Debug(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *Log) Debugf(msg string, args ...interface{}) {
	l.Logger.Sugar().Debugf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *Log) Info(msg string, fields ...zap.Field) {
	l.Logger.Info(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *Log) Infof(msg string, args ...interface{}) {
	l.Logger.Sugar().Infof(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *Log) Warn(msg string, fields ...zap.Field) {
	l.Logger.Warn(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *Log) Warnf(msg string, args ...interface{}) {
	l.Logger.Sugar().Warnf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *Log) Error(msg string, fields ...zap.Field) {
	l.Logger.Error(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *Log) Errorf(msg string, args ...interface{}) {
	l.Logger.Sugar().Errorf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func Get() Logger {
	return logger
}

func Set(l Logger) {
	logger = l
}
