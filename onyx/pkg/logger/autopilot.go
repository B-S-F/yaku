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
	Log
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
	core := zapcore.NewTee(
		zapcore.NewCore(consoleEncoder, zapcore.AddSync(hrBuffer), level),
		zapcore.NewCore(jsonEncoder, zapcore.AddSync(mrBuffer), level),
	)
	logger := zap.New(core)
	return &Autopilot{
		Log{
			logger,
			settings,
		},
		hrBuffer,
		mrBuffer,
	}
}

func (l *Autopilot) Flush() {
	fmt.Print(l.HumanReadableBuffer.String())
}

func (l *Autopilot) String() string {
	return l.HumanReadableBuffer.String()
}

func (l *Autopilot) ToFile() {
	if l.File == "" {
		l.Error("no log file specified")
		l.Flush()
		return
	}
	logs := l.MachineReadableBuffer.String()
	err := os.WriteFile(l.File, []byte(logs), 0644)
	if err != nil {
		l.Error("failed to write log file", zap.Error(err))
		l.Flush()
	}
}
