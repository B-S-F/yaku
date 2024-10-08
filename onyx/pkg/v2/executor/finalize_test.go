package executor

import (
	"strings"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/workdir"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

func TestFinalizeExecuteIntegration(t *testing.T) {
	item := &model.Finalize{
		Run: "echo 'hello world'",
		Env: map[string]string{
			"ENV_VAR1": "value1",
			"ENV_VAR2": "value2",
		},
		Configs: map[string]string{
			"config1": "value1",
			"config2": "value2",
		},
	}
	testCases := map[string]struct {
		run  []string
		want model.FinalizeResult
	}{
		"should return proper finalize result on zero exit": {
			run: []string{
				"echo 'hello world'",
			},
			want: model.FinalizeResult{
				ExitCode: 0,
				Logs:     []model.LogEntry{{Source: "stdout", Text: "hello world"}},
			},
		},
		"should return proper finalize result non zero bad exit": {
			run: []string{
				"echo 'hello world'\necho 'an error has occurred' >&2\nexit 1",
			},
			want: model.FinalizeResult{
				ExitCode: 1,
				Logs: []model.LogEntry{
					{Source: "stdout", Text: "hello world"},
					{Source: "stderr", Text: "an error has occurred"},
				},
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			logger := logger.NewAutopilot()
			item.Run = strings.Join(tc.run, "\n")
			wdUtils := workdir.NewUtils(afero.NewOsFs())
			env := make(map[string]string)
			secrets := make(map[string]string)

			// act
			finalizeExecutor := NewFinalizeExecutor(wdUtils, tmpDir, logger, 10*time.Minute)
			result, err := finalizeExecutor.Execute(item, env, secrets)

			// assert
			assert.NotNil(t, result)
			assert.NoError(t, err)
			assert.Equal(t, tc.want.ExitCode, result.ExitCode)
			assert.Equal(t, tc.want.Logs, result.Logs)
		})
	}
}
