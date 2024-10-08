//go:build unit
// +build unit

package helper

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseJsonMap(t *testing.T) {
	t.Run("should return a map of variables", func(t *testing.T) {
		content := []byte(`
{ 
	"VAR1": "value1",
  "VAR2": "value2",
	"VAR3": "file://testdata/configuration/variables.txt"
}
`)
		vars, err := ParseJsonMap(content)

		assert.NoError(t, err)
		assert.Equal(t, "value1", vars["VAR1"])
		assert.Equal(t, "value2", vars["VAR2"])
		assert.Equal(t, "file://testdata/configuration/variables.txt", vars["VAR3"])
	})

	t.Run("should return the map with multiline content", func(t *testing.T) {
		multiLineString := "line1\\nline2\\nline3"
		resultMLString := "line1\nline2\nline3"

		content := `
{
	"VAR1": "value1",
	"VAR2": "%s"
}
`
		content = fmt.Sprintf(content, multiLineString)

		vars, err := ParseJsonMap([]byte(content))

		assert.NoError(t, err)
		assert.Equal(t, "value1", vars["VAR1"])
		assert.Equal(t, resultMLString, vars["VAR2"])
	})

	t.Run("should return an empty map if no content is given", func(t *testing.T) {
		vars, err := ParseJsonMap([]byte{})

		assert.NoError(t, err)
		assert.Equal(t, len(vars), 0)

		vars, err = ParseJsonMap([]byte("{}"))

		assert.NoError(t, err)
		assert.Equal(t, len(vars), 0)
	})

	t.Run("should return an error if a variable is not valid", func(t *testing.T) {
		cases := []struct {
			name    string
			content []byte
		}{
			{
				name: "Empty Property",
				content: []byte(`
{
	"VAR1": "value1",
	"VAR2",
	"VAR3": "value3"
}
`),
			},
			{
				name: "Property contains object instead of string",
				content: []byte(`
{
	"VAR1": "value1",
	"VAR2: { 
		"VAR3": "value3"
	}
}
`),
			},
			{
				name: "Property contains array instead of string",
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

		for _, c := range cases {
			t.Run(c.name, func(t *testing.T) {
				_, err := ParseJsonMap(c.content)
				assert.ErrorContains(t, err, "could not parse json data")
			})
		}
	})
}
