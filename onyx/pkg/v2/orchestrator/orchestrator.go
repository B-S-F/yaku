package orchestrator

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/executor"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/workdir"
	errs "github.com/pkg/errors"
	"github.com/spf13/afero"
	"go.uber.org/zap"
)

type Orchestrator struct {
	rootWorkDir string
	strict      bool
	timeout     time.Duration
	logger      logger.Logger
}

func New(rootWorkDir string, strict bool, timeout time.Duration, logger logger.Logger) *Orchestrator {
	return &Orchestrator{rootWorkDir: rootWorkDir, timeout: timeout, logger: logger, strict: strict}
}

type manualExec struct {
	ManualCheck model.ManualCheck
	Result      *model.ManualResult
	Err         error
	Logs        *logger.Autopilot
}

type autopilotExec struct {
	AutopilotCheck model.AutopilotCheck
	Result         *model.AutopilotResult
	Err            error
	Logs           *logger.Autopilot
}

func (o *Orchestrator) Run(
	manuals []model.ManualCheck,
	autopilots []model.AutopilotCheck,
	env, secrets map[string]string) (model.RunResult, error) {

	o.logger.Info("starting execution plan")
	o.logger.Debug("manual checks", zap.Any("execution plan", manuals))
	o.logger.Debug("autopilot checks", zap.Any("execution plan", autopilots))

	var wg sync.WaitGroup

	wg.Add(2)
	manualRuns := make(chan []model.ManualRun)
	autopilotRuns := make(chan []model.AutopilotRun)
	errs := make(chan error, 2)

	go func(manuals []model.ManualCheck, wg *sync.WaitGroup, secrets map[string]string, runs chan<- []model.ManualRun, errs chan<- error) {
		defer wg.Done()
		res, err := o.runManuals(manuals, secrets)
		if err != nil {
			errs <- err
			return
		}

		runs <- res
	}(manuals, &wg, secrets, manualRuns, errs)

	go func(autopilots []model.AutopilotCheck, wg *sync.WaitGroup, secrets map[string]string, runs chan<- []model.AutopilotRun, errs chan<- error) {
		defer wg.Done()
		res, err := o.runAutopilots(autopilots, env, secrets)
		if err != nil {
			errs <- err
			return
		}

		runs <- res
	}(autopilots, &wg, secrets, autopilotRuns, errs)

	go func(wg *sync.WaitGroup, manualRuns chan<- []model.ManualRun, autopilotRuns chan<- []model.AutopilotRun, errs chan<- error) {
		wg.Wait()
		close(manualRuns)
		close(autopilotRuns)
		close(errs)
	}(&wg, manualRuns, autopilotRuns, errs)

	var runResult model.RunResult
	var errMsgs []string

	runResult.Manuals = <-manualRuns
	runResult.Autopilots = <-autopilotRuns

	for err := range errs {
		errMsgs = append(errMsgs, err.Error())
	}

	if errMsgs != nil {
		return model.RunResult{}, errors.New(strings.Join(errMsgs, ";"))
	}

	return runResult, nil
}

func (o *Orchestrator) runManuals(manuals []model.ManualCheck, secrets map[string]string) ([]model.ManualRun, error) {
	var wg sync.WaitGroup
	executions := make(chan manualExec, len(manuals))

	for _, m := range manuals {
		wg.Add(1)
		go func(manual model.ManualCheck, secrets map[string]string, wg *sync.WaitGroup, execs chan<- manualExec) {
			defer wg.Done()

			logger := logger.NewAutopilot(logger.Settings{
				Secrets: secrets,
			})
			manualExecutor := executor.NewManualExecutor(logger)

			logger.Info(fmt.Sprintf("[[ CHAPTER: %s REQUIREMENT: %s CHECK: %s ]]", strings.ToUpper(manual.Chapter.Id), strings.ToUpper(manual.Requirement.Id), strings.ToUpper(manual.Check.Id)))

			exec := manualExec{ManualCheck: manual, Logs: logger}
			exec.Result, exec.Err = manualExecutor.Execute(&manual)

			execs <- exec
		}(m, secrets, &wg, executions)
	}

	go func(wg *sync.WaitGroup, executions chan manualExec) {
		wg.Wait()
		close(executions)
	}(&wg, executions)

	var errMsgs []string
	var runs []model.ManualRun
	for exec := range executions {
		exec.Logs.Flush()

		if exec.Err != nil {
			errMsgs = append(errMsgs, exec.Err.Error())
			continue
		}

		runs = append(runs, model.ManualRun{
			ManualCheck: exec.ManualCheck,
			Result:      exec.Result,
		})
	}

	if errMsgs != nil {
		return nil, errors.New(strings.Join(errMsgs, ";"))
	}

	return runs, nil
}

func (o *Orchestrator) runAutopilots(autopilots []model.AutopilotCheck, env, secrets map[string]string) ([]model.AutopilotRun, error) {
	var wg sync.WaitGroup
	executions := make(chan autopilotExec, len(autopilots))

	for _, a := range autopilots {
		wg.Add(1)
		go func(autopilot model.AutopilotCheck, secrets map[string]string, wg *sync.WaitGroup, execs chan<- autopilotExec, rootWorkDir string, strict bool, timeout time.Duration) {
			defer wg.Done()

			logger := logger.NewAutopilot(logger.Settings{
				Secrets: secrets,
			})

			autopilotExecutor := executor.NewAutopilotExecutor(
				workdir.NewUtils(afero.NewOsFs()),
				o.rootWorkDir,
				o.strict,
				logger,
				o.timeout)

			logger.Info(fmt.Sprintf("[[ CHAPTER: %s REQUIREMENT: %s CHECK: %s ]]", strings.ToUpper(autopilot.Chapter.Id), strings.ToUpper(autopilot.Requirement.Id), strings.ToUpper(autopilot.Check.Id)))

			exec := autopilotExec{AutopilotCheck: autopilot, Logs: logger}
			exec.Result, exec.Err = autopilotExecutor.ExecuteAutopilotCheck(&autopilot, env, secrets)
			execs <- exec
		}(a, secrets, &wg, executions, o.rootWorkDir, o.strict, o.timeout)
	}

	go func(wg *sync.WaitGroup, executions chan autopilotExec) {
		wg.Wait()
		close(executions)
	}(&wg, executions)

	var errMsgs []string
	var runs []model.AutopilotRun
	for exec := range executions {
		exec.Logs.Flush()

		if exec.Err != nil {
			errMsgs = append(errMsgs, exec.Err.Error())
			continue
		}

		runs = append(runs, model.AutopilotRun{
			AutopilotCheck: exec.AutopilotCheck,
			Result:         exec.Result,
		})
	}

	if errMsgs != nil {
		return nil, errors.New(strings.Join(errMsgs, ";"))
	}

	return runs, nil
}

func (o *Orchestrator) RunFinalizer(finalize model.Finalize, env, secrets map[string]string) (*model.FinalizeResult, error) {
	o.logger.Info("finalizer started")
	o.logger.Debug("finalizer config", zap.Any("finalizer", finalize))
	logger := logger.NewAutopilot(logger.Settings{
		Secrets: secrets,
		File:    filepath.Join(o.rootWorkDir, "finalizer.log"),
	})
	defer logger.Flush()
	defer logger.ToFile()

	finalizeExecutor := executor.NewFinalizeExecutor(workdir.NewUtils(afero.NewOsFs()), o.rootWorkDir, logger, o.timeout)

	result, err := finalizeExecutor.Execute(&finalize, env, secrets)
	if err != nil {
		return nil, errs.Wrap(err, "failed to run finalize execute")
	}
	return result, nil
}
