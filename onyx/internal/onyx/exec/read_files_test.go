//go:build unit
// +build unit

package exec

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockReader struct {
	mock.Mock
}

func (m *mockReader) Read(name string) ([]byte, error) {
	args := m.Called(name)
	return args.Get(0).([]byte), args.Error(1)
}

func (m *mockReader) ReadJsonMap(name string) (map[string]string, error) {
	args := m.Called(name)
	return args.Get(0).(map[string]string), args.Error(1)
}

func TestReadFiles(t *testing.T) {
	execParams := parameter.ExecutionParameter{
		InputFolder: "test",
		ConfigName:  "config",
		VarsName:    "vars",
		SecretsName: "secrets",
	}
	configContent := []byte("config")
	varsContent := map[string]string{"VAR": "var"}
	secretsContent := map[string]string{"SECRET": "secret"}

	testCases := map[string]struct {
		name         string
		configError  error
		varsError    error
		secretsError error
	}{
		"should read config, vars and secrets files": {
			configError:  nil,
			varsError:    nil,
			secretsError: nil,
		},
		"should return an error if reading config file fails": {
			configError: assert.AnError,
		},
		"should return an error if reading vars file fails": {
			configError: nil,
			varsError:   assert.AnError,
		},
		"should return an error if reading secrets file fails": {
			configError:  nil,
			varsError:    nil,
			secretsError: assert.AnError,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			mock := &mockReader{}
			mock.On("Read", "test/config").Return(configContent, tc.configError)
			mock.On("ReadJsonMap", "test/vars").Return(varsContent, tc.varsError)
			mock.On("ReadJsonMap", "test/secrets").Return(secretsContent, tc.secretsError)

			// act
			config, vars, secrets, err := ReadFiles(execParams, mock)

			// assert
			if tc.configError != nil || tc.varsError != nil || tc.secretsError != nil {
				assert.Error(t, err)
				return

			}
			assert.NoError(t, err)
			assert.Equal(t, []byte("config"), config)
			assert.Equal(t, map[string]string{"VAR": "var"}, vars)
			assert.Equal(t, map[string]string{"SECRET": "secret"}, secrets)
		})
	}
}
