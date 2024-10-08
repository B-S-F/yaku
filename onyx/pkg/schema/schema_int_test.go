//go:build integration
// +build integration

package schema

import (
	"flag"
	"testing"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/stretchr/testify/assert"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

type configMockInt struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

var configYaml = []byte(`
name: value
version: v1
`)

func TestSchemaIntegration(t *testing.T) {
	t.Run("should load and validate schema for config", func(t *testing.T) {
		// arrange
		schema := &Schema{}

		// act
		schema.Load(configMockInt{})
		jsonSchema := schema.JSON()
		err := schema.Validate(configYaml)

		// assert
		assert.NoError(t, err)
		want := helper.GoldenValue(t, "schema.golden", jsonSchema, *update)
		assert.Equal(t, string(jsonSchema), string(want))
	})
}
