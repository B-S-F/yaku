package finalize

import (
	"path/filepath"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

type Result struct {
	Config *configuration.Item
	Output *executor.Output
	Logs   *logger.Autopilot
}

type Engine struct {
	rootWorkDir string
	timeout     time.Duration
	logger      logger.Logger
}

func NewEngine(rootWorkDir string, timeout time.Duration) *Engine {
	return &Engine{
		rootWorkDir: rootWorkDir,
		timeout:     timeout,
		logger:      logger.Get(),
	}
}

func (e *Engine) Run(item *configuration.Item, env, secrets map[string]string) (*Result, error) {
	e.logger.Info("finalizer started")
	e.logger.Debug("finalizer config", zap.Any("finalizer", item))

	logger := logger.NewAutopilot(logger.Settings{
		Secrets: secrets,
		File:    filepath.Join(e.rootWorkDir, "finalizer.log"),
	})
	defer logger.Flush()
	defer logger.ToFile()
	fe := executor.NewFinalizer(e.rootWorkDir, e.timeout, logger)
	output, err := fe.Execute(item, env, nil, secrets)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run finalize")
	}
	itemResult := &Result{
		Config: item,
		Output: output,
		Logs:   logger,
	}
	return itemResult, nil
}
