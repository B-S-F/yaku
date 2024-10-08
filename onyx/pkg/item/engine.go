package item

import (
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/helper"
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
	strict      bool
	timeout     time.Duration
	channels    *Channels
	logger      logger.Logger
}

type Channels struct {
	result chan Result
	err    chan error
}

func (c *Channels) Init(length int) {
	c.result = make(chan Result, length)
	c.err = make(chan error, length)
}

func (c *Channels) Close() {
	close(c.result)
	close(c.err)
}

func NewEngine(rootWorkDir string, strict bool, timeout time.Duration) *Engine {
	return &Engine{
		rootWorkDir: rootWorkDir,
		strict:      strict,
		timeout:     timeout,
		channels:    &Channels{},
		logger:      logger.Get(),
	}
}

func (e *Engine) Run(items *[]configuration.Item, env, vars, secrets map[string]string) ([]Result, error) {
	if items == nil {
		return nil, nil
	}
	e.logger.Info("starting execution plan")
	e.logger.Debug("items", zap.Any("execution plan", items))
	e.channels.Init(len(*items))
	var wg sync.WaitGroup
	for index := range *items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			item := &(*items)[index]
			e.logger.Debug("item", zap.String("item", item.String()))
			itemResult, err := e.executeItem(item, env, vars, secrets)
			if err != nil {
				e.channels.err <- err
				return
			}
			e.logger.Debug("output", zap.String("output", itemResult.Output.String()))
			e.channels.result <- *itemResult
		}(index)
	}
	go func() {
		wg.Wait()
		e.channels.Close()
	}()
	results := make([]Result, 0, len(*items))
	for result := range e.channels.result {
		results = append(results, result)
		result.Logs.Flush()
	}
	var joinedErr error
	for err := range e.channels.err {
		joinedErr = helper.Join(joinedErr, err)
	}
	if joinedErr != nil {
		return nil, joinedErr
	}
	return results, nil
}

func (ie *Engine) executeItem(item *configuration.Item, env, vars, secrets map[string]string) (*Result, error) {
	var err error
	var output *executor.Output
	logger := logger.NewAutopilot(logger.Settings{
		Secrets: secrets,
	})
	logger.Info(fmt.Sprintf("[[ CHAPTER: %s REQUIREMENT: %s CHECK: %s ]]", strings.ToUpper(item.Chapter.Id), strings.ToUpper(item.Requirement.Id), strings.ToUpper(item.Check.Id)))
	if item.Manual != (configuration.Manual{}) {
		me := executor.NewManual(logger)
		output, err = me.Execute(item, env, vars, secrets)
		if err != nil {
			return nil, errors.Wrap(err, "failed to run manual item")
		}
	} else {
		ae := executor.NewAutopilot(ie.strict, ie.rootWorkDir, ie.timeout, logger)
		output, err = ae.Execute(item, env, vars, secrets)
		if err != nil {
			return nil, errors.Wrap(err, "failed to run autopilot")
		}
		logger.File = filepath.Join(output.EvidencePath, "autopilot.log")
		defer logger.ToFile()
	}
	itemResult := &Result{
		Config: item,
		Output: output,
		Logs:   logger,
	}
	return itemResult, nil
}
