// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package logger

import (
	"github.com/B-S-F/yaku/onyx/pkg/helper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger interface {
	Debug(msg string, fields ...zap.Field)
	Debugf(msg string, args ...interface{})
	Info(msg string, fields ...zap.Field)
	Infof(msg string, args ...interface{})
	Warn(msg string, fields ...zap.Field)
	Warnf(msg string, args ...interface{})
	Error(msg string, fields ...zap.Field)
	Errorf(msg string, args ...interface{})
	UserError(msg string, fields ...zap.Field)
	UserErrorf(msg string, args ...interface{})
}

type Settings struct {
	Level   string
	Files   []string
	Secrets map[string]string
}

var logger Logger

var ENCODER_CONFIG zapcore.EncoderConfig

func init() {
	logger = NewConsoleFileLogger()
}

func Get() Logger {
	return logger
}

func Set(l Logger) {
	logger = l
}

type HideSecretsLog struct {
	logger *zap.Logger
	Settings
}

func NewHideSecretsLogger(logger *zap.Logger, settings Settings) *HideSecretsLog {
	return &HideSecretsLog{logger: logger, Settings: settings}
}

func (l *HideSecretsLog) Debug(msg string, fields ...zap.Field) {
	l.logger.Debug(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *HideSecretsLog) Debugf(msg string, args ...interface{}) {
	l.logger.Sugar().Debugf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *HideSecretsLog) Info(msg string, fields ...zap.Field) {
	l.logger.Info(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *HideSecretsLog) Infof(msg string, args ...interface{}) {
	l.logger.Sugar().Infof(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *HideSecretsLog) Warn(msg string, fields ...zap.Field) {
	l.logger.Warn(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *HideSecretsLog) Warnf(msg string, args ...interface{}) {
	l.logger.Sugar().Warnf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *HideSecretsLog) Error(msg string, fields ...zap.Field) {
	l.logger.Error(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *HideSecretsLog) Errorf(msg string, args ...interface{}) {
	l.logger.Sugar().Errorf(helper.HideSecretsInString(msg, l.Secrets), args...)
}

func (l *HideSecretsLog) UserError(msg string, fields ...zap.Field) {
	l.logger.Error(helper.HideSecretsInString(msg, l.Secrets), fields...)
}

func (l *HideSecretsLog) UserErrorf(msg string, args ...interface{}) {
	l.logger.Sugar().Errorf(helper.HideSecretsInString(msg, l.Secrets), args...)
}
