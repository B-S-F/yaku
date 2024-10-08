//go:build unit
// +build unit

package reader

import (
	"fmt"
	"testing"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

type mockFileRead struct {
	mock.Mock
}

func (m *mockFileRead) readFile(name string) ([]byte, error) {
	args := m.Called(name)
	return args.Get(0).([]byte), args.Error(1)
}

var nopLogger = &logger.Log{
	Logger: zap.NewNop(),
}

func TestRead(t *testing.T) {
	mock := &mockFileRead{}
	r := &fileReader{
		logger: nopLogger,
		reader: mock.readFile,
	}
	t.Run("should return an error if reading fails", func(t *testing.T) {
		// arrange
		mock.On("readFile", "config.yaml").Return([]byte{}, assert.AnError).Once()

		// act
		_, err := r.Read("config.yaml")

		// assert
		assert.Error(t, err)
	})

	t.Run("should read a file and return the content", func(t *testing.T) {
		// arrange
		mock.On("readFile", "config.yaml").Return([]byte("test"), nil).Once()

		// act
		content, err := r.Read("config.yaml")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, []byte("test"), content)
	})
}

func TestParseJsonMap(t *testing.T) {
	mock := &mockFileRead{}
	r := &fileReader{
		logger: nopLogger,
		reader: mock.readFile,
	}
	t.Run("should return a map of variables", func(t *testing.T) {
		// arrange
		content := []byte(`
{
	"VAR1": "value1",
    "VAR2": "value2",
	"VAR3": "file://testdata/variables.txt"
}
`)
		mock.On("readFile", "vars.json").Return([]byte(content), nil).Once()
		// act
		vars, err := r.ReadJsonMap("vars.json")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, "value1", vars["VAR1"])
		assert.Equal(t, "value2", vars["VAR2"])
		assert.Equal(t, "file://testdata/variables.txt", vars["VAR3"])
	})

	t.Run("should return the map with multiline content", func(t *testing.T) {
		// arrange
		multiLineString := "line1\\nline2\\nline3"
		resultMLString := "line1\nline2\nline3"
		content := `
{
	"VAR1": "value1",
	"VAR2": "%s"
}
`
		content = fmt.Sprintf(content, multiLineString)
		mock.On("readFile", "vars.json").Return([]byte(content), nil).Once()
		// act
		vars, err := r.ReadJsonMap("vars.json")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, "value1", vars["VAR1"])
		assert.Equal(t, resultMLString, vars["VAR2"])
	})

	t.Run("should return an empty map if no content is given", func(t *testing.T) {
		// arrage
		mock.On("readFile", "vars.json").Return([]byte{}, nil).Once()

		// act
		vars, err := r.ReadJsonMap("vars.json")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, len(vars), 0)

		// arrage
		mock.On("readFile", "vars.json").Return([]byte("{}"), nil).Once()

		// act
		vars, err = r.ReadJsonMap("vars.json")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, len(vars), 0)
	})

	t.Run("should return an error if a variable is not valid", func(t *testing.T) {
		testCases := map[string]struct {
			content []byte
		}{
			"Empty Property": {
				content: []byte(`
{
	"VAR1": "value1",
	"VAR2",
	"VAR3": "value3"
}
`),
			},
			"Property contains object instead of string": {
				content: []byte(`
{
	"VAR1": "value1",
	"VAR2: {
		"VAR3": "value3"
	}
}
`),
			},
			"Property contains array instead of string": {
				content: []byte(`
{
	"VAR1": "value1",
	"VAR2: [
		{
			"VAR3": "value3"
		}
	]
}
`),
			},
		}

		for name, tc := range testCases {
			t.Run(name, func(t *testing.T) {
				// arrange
				mock.On("readFile", "vars.json").Return([]byte(tc.content), nil).Once()

				// act
				_, err := r.ReadJsonMap("vars.json")

				// assert
				assert.ErrorContains(t, err, "could not parse json data")
			})
		}
	})
}
