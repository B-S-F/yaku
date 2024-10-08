package executor

import (
	"path/filepath"
	"time"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/output"
	"github.com/B-S-F/onyx/pkg/v2/runner"
	"github.com/B-S-F/onyx/pkg/workdir"
	"github.com/pkg/errors"
)

type FinalizeExecutor struct {
	wdUtils     workdir.Utilizer
	rootWorkDir string
	logger      *logger.Autopilot
	timeout     time.Duration
	runner      *runner.Subprocess
}

func NewFinalizeExecutor(wdUtils workdir.Utilizer, rootWorkDir string, logger *logger.Autopilot, timeout time.Duration) *FinalizeExecutor {
	return &FinalizeExecutor{
		wdUtils:     wdUtils,
		rootWorkDir: rootWorkDir,
		logger:      logger,
		timeout:     timeout,
		runner:      runner.NewSubprocess(logger),
	}
}

func (f *FinalizeExecutor) Execute(item *model.Finalize, env, secrets map[string]string) (*model.FinalizeResult, error) {
	err := overWriteConfigFiles(f.wdUtils, item.Configs, f.rootWorkDir)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create config files")
	}
	specialEnv := map[string]string{"result_path": f.rootWorkDir}
	runtimeEnv := helper.MergeMaps(env, item.Env, specialEnv)
	runnerOutput, err := StartRunner(f.rootWorkDir, item.Run, runtimeEnv, secrets, f.logger, f.runner, f.timeout)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run finalize")
	}
	result := &model.FinalizeResult{
		Logs:       runnerOutput.Logs,
		ExitCode:   runnerOutput.ExitCode,
		OutputPath: runnerOutput.WorkDir,
	}
	output := output.Output{
		Logs:     runnerOutput.Logs,
		ExitCode: runnerOutput.ExitCode,
	}

	err = output.Log(f.logger)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func overWriteConfigFiles(wdUtils workdir.Utilizer, configs map[string]string, workDir string) error {
	for file, content := range configs {
		err := wdUtils.UpdateContentForce(filepath.Join(workDir, file), []byte(content))
		if err != nil {
			return errors.Wrapf(err, "failed to overwrite config file %s", file)
		}
	}
	return nil
}
