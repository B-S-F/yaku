package executor

import (
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/runner"
	"go.uber.org/zap"
)

func StartRunner(workDir string, run string, env, secrets map[string]string, logger *logger.Autopilot, scriptRunner runner.Runner, timeout time.Duration) (*runner.Output, error) {
	logger.Debug("running", zap.String("workdir", workDir), zap.String("run", run))
	input := runner.Input{
		Cmd:     "/bin/bash",
		Args:    append([]string{"-c"}, "set -e\n"+run),
		Env:     env,
		Secrets: secrets,
		WorkDir: workDir,
	}
	out, err := scriptRunner.Execute(&input, timeout)
	logger.Debug("output", zap.Any("output", out), zap.Error(err))
	return out, err
}
