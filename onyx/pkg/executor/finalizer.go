package executor

import (
	"path/filepath"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"github.com/B-S-F/onyx/pkg/workdir"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
)

type Finalizer struct {
	wdUtils workdir.Utilizer
	Exec
}

func NewFinalizer(rootWorkDir string, timeout time.Duration, logger *logger.Autopilot) *Finalizer {
	exec := Exec{
		runner:      runner.NewSubprocess(logger),
		timeout:     timeout,
		rootWorkDir: rootWorkDir,
		logger:      logger,
	}
	return &Finalizer{
		workdir.NewUtils(afero.NewOsFs()),
		exec,
	}
}

func (f *Finalizer) Execute(config *configuration.Item, env, vars, secrets map[string]string) (*Output, error) {
	err := f.overwriteConfigFiles(config.Config, f.rootWorkDir)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create config files")
	}
	specialEnv := map[string]string{"result_path": f.rootWorkDir}
	runtimeEnv := helper.MergeMaps(env, config.Autopilot.Env, config.Env, specialEnv)
	runnerOutput, err := f.startRunner(f.rootWorkDir, config.Run, runtimeEnv, secrets)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run finalize")
	}
	output := f.output(runnerOutput)
	output.Log(f.logger)
	return output, nil
}

func (f *Finalizer) overwriteConfigFiles(config map[string]string, workDir string) error {
	for file, content := range config {
		err := f.wdUtils.UpdateContentForce(filepath.Join(workDir, file), []byte(content))
		if err != nil {
			return errors.Wrapf(err, "failed to overwrite config file %s", file)
		}
	}
	return nil
}

func (f *Finalizer) output(out *runner.Output) *Output {
	return &Output{
		Logs:         out.Logs,
		ErrLogs:      out.ErrLogs,
		ExitCode:     out.ExitCode,
		EvidencePath: out.WorkDir,
	}
}
