//go:build integration
// +build integration

package exec

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/reader"
	"github.com/stretchr/testify/assert"
)

func TestReadFilesIntegration(t *testing.T) {
	t.Run("should read config, vars and secrets files", func(t *testing.T) {
		// arrange
		execParams := parameter.ExecutionParameter{
			InputFolder: "testdata",
			ConfigName:  "config.yaml",
			VarsName:    "vars.json",
			SecretsName: "secrets.json",
		}
		reader := reader.New()

		// act
		config, vars, secrets, err := ReadFiles(execParams, reader)

		// assert
		assert.NoError(t, err)
		assert.Equal(t, []byte("metadata:\n  version: v1"), config)
		assert.Equal(t, map[string]string{"VAR": "var"}, vars)
		assert.Equal(t, map[string]string{"SECRET": "secret"}, secrets)
	})
}
