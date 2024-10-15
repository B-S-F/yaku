package logger

import (
	"bytes"
	"fmt"
	"os"

	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Autopilot struct {
	consoleLogger         HideSecretsLog
	jsonLogger            HideSecretsLog
	HumanReadableBuffer   *bytes.Buffer
	MachineReadableBuffer *bytes.Buffer
}

func NewAutopilot(s ...Settings) *Autopilot {
	settings := Settings{}
	if len(s) > 0 {
		settings = s[0]
	}
	if settings.Level == "" {
		settings.Level = viper.GetString("log-level")
	}
	level, _ := zapcore.ParseLevel(settings.Level)
	hrBuffer := &bytes.Buffer{}
	mrBuffer := &bytes.Buffer{}
	jsonEncoderConfig := zap.NewProductionEncoderConfig()
	jsonEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	jsonEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	consoleEncoder := zapcore.NewConsoleEncoder(ENCODER_CONFIG)
	jsonEncoder := zapcore.NewJSONEncoder(jsonEncoderConfig)
	return &Autopilot{
		consoleLogger: HideSecretsLog{
			logger:   zap.New(zapcore.NewCore(consoleEncoder, zapcore.AddSync(hrBuffer), level)),
			Settings: settings,
		},
		jsonLogger: HideSecretsLog{
			logger:   zap.New(zapcore.NewCore(jsonEncoder, zapcore.AddSync(mrBuffer), level)),
			Settings: settings,
		},
		HumanReadableBuffer:   hrBuffer,
		MachineReadableBuffer: mrBuffer,
	}
}

func (l *Autopilot) Flush() {
	fmt.Print(l.HumanReadableBuffer.String())
}

func (l *Autopilot) String() string {
	return l.HumanReadableBuffer.String()
}

func (l *Autopilot) SetFiles(files []string) {
	l.jsonLogger.Files = files
}

func (l *Autopilot) ToFile() {
	if len(l.jsonLogger.Files) == 0 {
		l.Error("no log file specified")
		l.Flush()
		return
	}
	logs := l.MachineReadableBuffer.String()

	for _, file := range l.jsonLogger.Files {
		err := os.WriteFile(file, []byte(logs), 0644)
		if err != nil {
			l.Error("failed to write log file", zap.Error(err))
			l.Flush()
		}
	}
}

func (c *Autopilot) Debug(msg string, fields ...zap.Field) {
	c.consoleLogger.Debug(msg, fields...)
	c.jsonLogger.Debug(msg, fields...)
}

func (c *Autopilot) Debugf(msg string, args ...interface{}) {
	c.consoleLogger.Debugf(msg, args...)
	c.jsonLogger.Debugf(msg, args...)
}

func (c *Autopilot) Info(msg string, fields ...zap.Field) {
	c.consoleLogger.Info(msg, fields...)
	c.jsonLogger.Info(msg, fields...)
}

func (c *Autopilot) Infof(msg string, args ...interface{}) {
	c.consoleLogger.Infof(msg, args...)
	c.jsonLogger.Infof(msg, args...)
}

func (c *Autopilot) Warn(msg string, fields ...zap.Field) {
	c.consoleLogger.Warn(msg, fields...)
	c.jsonLogger.Warn(msg, fields...)
}

func (c *Autopilot) Warnf(msg string, args ...interface{}) {
	c.consoleLogger.Warnf(msg, args...)
	c.jsonLogger.Warnf(msg, args...)
}

func (c *Autopilot) Error(msg string, fields ...zap.Field) {
	zapFields := []zap.Field{zap.String("category", "SYSTEM")}
	zapFields = append(zapFields, fields...)
	c.consoleLogger.Error(msg, fields...)
	c.jsonLogger.Error(msg, zapFields...)
}

func (c *Autopilot) Errorf(msg string, args ...interface{}) {
	zapField := zap.String("category", "SYSTEM")
	c.consoleLogger.Errorf(msg, args...)
	c.jsonLogger.Error(fmt.Sprintf(msg, args...), zapField)
}

func (c *Autopilot) UserError(msg string, fields ...zap.Field) {
	zapFields := []zap.Field{zap.String("category", "USER")}
	zapFields = append(zapFields, fields...)
	c.consoleLogger.Warn(msg, fields...)
	c.jsonLogger.Error(msg, zapFields...)
}

func (c *Autopilot) UserErrorf(msg string, args ...interface{}) {
	c.consoleLogger.Warnf(msg, args...)
	c.jsonLogger.Error(fmt.Sprintf(msg, args...), zap.String("category", "USER"))
}
