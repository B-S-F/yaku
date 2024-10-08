//go:build unit
// +build unit

package schema

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xeipuuv/gojsonschema"
)

type configMock struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

var wantSchema = `
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/B-S-F/onyx/pkg/schema/config-mock",
  "$ref": "#/$defs/configMock",
  "$defs": {
    "configMock": {
      "properties": {
        "name": {
          "type": "string"
        },
        "version": {
          "type": "string"
        }
      },
      "additionalProperties": false,
      "type": "object"
    }
  }
}
`

func TestSchemaValidate(t *testing.T) {
	testCases := map[string]struct {
		yamlData []byte
		wantErr  bool
	}{
		"should not return error if valid data and valid replace pattern is used": {
			yamlData: []byte("name: ${{ env.env }} ${{ secrets.secrets }}\nversion: ${{ vars.vars }}"),
			wantErr:  false,
		},
		"should not return error if valid data and deprecated replace pattern is used": {
			yamlData: []byte("name: ${{ envs.env }} ${{ secret.secrets }}\nversion: ${{ var.vars }}"),
			wantErr:  false,
		},
		"should return error if invalid data is used": {
			yamlData: []byte("error: value"),
			wantErr:  true,
		},
		"should return error if invalid replace pattern is used": {
			yamlData: []byte("name: ${{ test.invalid }}"),
			wantErr:  true,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			schema := &Schema{}
			schema.Load(configMock{})

			// act
			err := schema.Validate(tc.yamlData)

			// assert
			if tc.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestSchemaLoad(t *testing.T) {
	t.Run("should load a schema successfully", func(t *testing.T) {
		// arrange
		config := configMock{
			Name:    "value",
			Version: "v1",
		}
		schema := &Schema{}

		// act
		err := schema.Load(config)

		// assert
		require.NoError(t, err)
		require.NotNil(t, schema.json)
		require.NotNil(t, schema.validator)
		require.NotNil(t, schema.logger)
	})
}

func TestSchemaJSON(t *testing.T) {
	t.Run("should return json schema when schema is loaded", func(t *testing.T) {
		// arrange
		config := configMock{
			Name:    "value",
			Version: "v1",
		}
		schema := &Schema{}
		schema.Load(config)

		// act
		got := schema.JSON()

		// assert
		assert.JSONEq(t, string(wantSchema), string(got))
	})
	t.Run("should return empty json schema when no schema is loaded", func(t *testing.T) {
		// arrange
		schema := &Schema{}

		// act
		got := schema.JSON()

		// assert
		assert.Empty(t, got)
	})
}

func TestLoadSchema(t *testing.T) {
	t.Run("should return json schema and validator", func(t *testing.T) {
		// act
		got, schema, err := loadSchema(configMock{})

		// assert
		assert.NoError(t, err)
		assert.JSONEq(t, string(wantSchema), string(got))
		assert.IsType(t, schema.Validate, func(gojsonschema.JSONLoader) (*gojsonschema.Result, error) { return nil, nil })
	})
}

func TestCreateJSONSchema(t *testing.T) {
	t.Run("should return json schema", func(t *testing.T) {
		// arrange
		config := configMock{
			Name:    "value",
			Version: "v1",
		}
		want := []byte(wantSchema)

		// act
		got, err := createJSONSchema(config)

		// assert
		assert.NoError(t, err)
		assert.JSONEq(t, string(want), string(got))
	})
}

func TestCreateSchemaValidator(t *testing.T) {
	// arrange
	schemaJSON := []byte(wantSchema)
	config := configMock{
		Name:    "value",
		Version: "v1",
	}

	// act
	schema, err := createSchemaValidator(schemaJSON)

	// assert
	assert.NoError(t, err)
	dataLoader := gojsonschema.NewGoLoader(&config)
	result, err := schema.Validate(dataLoader)
	assert.NoError(t, err)
	assert.True(t, result.Valid())
}
