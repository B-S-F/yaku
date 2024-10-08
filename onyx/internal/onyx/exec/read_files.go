package exec

import (
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/reader"
)

func ReadFiles(execParams parameter.ExecutionParameter, reader reader.FileReader) ([]byte, map[string]string, map[string]string, error) {
	vars := make(map[string]string)
	secrets := make(map[string]string)
	configFile := filepath.Join(execParams.InputFolder, execParams.ConfigName)
	varsFile := filepath.Join(execParams.InputFolder, execParams.VarsName)
	secretsFile := filepath.Join(execParams.InputFolder, execParams.SecretsName)
	config, err := reader.Read(configFile)
	if err != nil {
		return config, vars, secrets, err
	}
	if varsFile != "" {
		vars, err = reader.ReadJsonMap(varsFile)
		if err != nil {
			return config, vars, secrets, err
		}
	}
	if secretsFile != "" {
		secrets, err = reader.ReadJsonMap(secretsFile)
		if err != nil {
			return config, vars, secrets, err
		}
	}
	return config, vars, secrets, nil
}
