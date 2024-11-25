// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package runner

import (
	"time"

	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
)

const (
	stdOutSourceType = "stdout"
	stdErrSourceType = "stderr"
)

type Input struct {
	Cmd     string
	Args    []string
	Env     map[string]string
	Secrets map[string]string
	WorkDir string
}

type Output struct {
	JsonData []map[string]interface{}
	WorkDir  string
	Logs     []model.LogEntry
	ExitCode int
}

type Runner interface {
	Execute(input *Input, timeout time.Duration) (*Output, error)
}
