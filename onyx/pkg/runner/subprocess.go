package runner

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"go.uber.org/zap"
)

type Subprocess struct {
	logger logger.Logger
}

func NewSubprocess(logger *logger.Autopilot) *Subprocess {
	return &Subprocess{
		logger: logger,
	}
}

func (s *Subprocess) Execute(input *Input, timeout time.Duration) (*Output, error) {
	cmd, ctx, cancel := s.initCommand(input, timeout)
	defer cancel()
	// start command
	s.logger.Debug("Starting command", zap.String("cmd", input.Cmd), zap.Strings("args", input.Args))
	var outbuf, errbuf strings.Builder
	cmd.Stdout = &outbuf
	cmd.Stderr = &errbuf
	exitCode := s.runCommand(cmd, ctx)
	// parse output
	out := s.parseOutput(input, exitCode, outbuf.String(), errbuf.String())
	if exitCode == 124 {
		out.ErrLogs = append(out.ErrLogs, fmt.Sprintf("Command timed out after %s", timeout))
	}
	return out, nil
}

func (s *Subprocess) initCommand(input *Input, timeout time.Duration) (*exec.Cmd, context.Context, context.CancelFunc) {
	// context with timeout
	if timeout <= 0 {
		s.logger.Warnf("Timeout is set to '%s'. Please make sure this is intended.", timeout)
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	// init command
	cmd := exec.CommandContext(ctx, input.Cmd, input.Args...)
	if input.WorkDir != "" {
		cmd.Dir = input.WorkDir
	}
	cmd.Env = append(cmd.Env, os.Environ()...)
	for k, v := range input.Env {
		cmd.Env = append(cmd.Env, []string{fmt.Sprintf("%s=%s", k, v)}...)
	}
	return cmd, ctx, cancel
}

func (s *Subprocess) runCommand(cmd *exec.Cmd, ctx context.Context) int {
	s.logger.Debug("Starting command", zap.String("cmd", cmd.String()))
	err := cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		s.logger.Debug("Command timed out", zap.String("cmd", cmd.String()))
		return 124
	}
	s.logger.Debug("Command finished", zap.String("cmd", cmd.String()), zap.Error(err))
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return exitError.ExitCode()
		} else {
			s.logger.Errorf("Unknown error while executing command: %s", err)
			return -1
		}
	}
	return 0
}

func (s *Subprocess) parseOutput(input *Input, exitCode int, stdout, stderr string) *Output {
	out := &Output{}
	out.WorkDir = input.WorkDir
	out.ExitCode = exitCode
	outStr := helper.HideSecretsInString(stdout, input.Secrets)
	errStr := helper.HideSecretsInString(stderr, input.Secrets)
	out.parseLogStrings(outStr, errStr)
	return out
}
