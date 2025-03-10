// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package schema

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/B-S-F/yaku/onyx/pkg/replacer"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/invopop/jsonschema"
	"github.com/invopop/yaml"
	"github.com/pkg/errors"
	"github.com/xeipuuv/gojsonschema"
)

type SchemaHandler interface {
	Validate([]byte) error
	JSON() []byte
	Load(anySchema interface{}) error
}

type Schema struct {
	validator *gojsonschema.Schema
	json      []byte
	logger    logger.Logger
}

func (s *Schema) Load(anySchema interface{}) error {
	schemaJSON, schemaValidator, err := loadSchema(anySchema)
	if err != nil {
		return err
	}

	s.json = schemaJSON
	s.validator = schemaValidator
	s.logger = logger.Get()
	return nil
}

func (s *Schema) JSON() []byte {
	return s.json
}

func (s *Schema) Validate(yamlData []byte) error {
	var data interface{}
	err := yaml.Unmarshal(yamlData, &data)
	if err != nil {
		return errors.Wrapf(err, "error unmarshalling data: %s", err)
	}
	// validate schema
	dataLoader := gojsonschema.NewGoLoader(&data)
	result, err := s.validator.Validate(dataLoader)
	if err != nil {
		return errors.Wrapf(err, "error validating data: %s", err)
	}
	if !result.Valid() {
		var validationErrs []string
		for _, desc := range result.Errors() {
			validationErrs = append(validationErrs, fmt.Sprintf("  - %s", desc))
		}
		return model.NewUserErr(errors.New(fmt.Sprintf("\n%s", strings.Join(validationErrs, "\n"))), "config data does not match schema")
	}
	// validate replace patterns
	patterns := replacer.FindAllReplacePatterns(string(yamlData))
	for _, line := range patterns {
		for _, pattern := range line {
			if !replacer.IsValidReplacePattern(pattern) {
				if replacer.IsDeprecatedReplacePattern(pattern) {
					s.logger.Warnf("deprecated pattern '%s' found. Valid patterns are: ${{ secrets.<secret_name> }}, ${{ vars.<var_name> }}, and ${{ env.<env_name> }}", pattern)
				} else {
					errorMsg := fmt.Sprintf("invalid pattern '%s' found. Valid patterns are: ${{ secrets.<secret_name> }}, ${{ vars.<var_name> }} and ${{ env.<env_name> }}", pattern)
					return model.NewUserErr(errors.New(errorMsg), "config contains invalid replace pattern")
				}
			}
		}
	}
	return nil
}

func loadSchema(anySchema interface{}) ([]byte, *gojsonschema.Schema, error) {
	JSONSchema, err := createJSONSchema(anySchema)
	if err != nil {
		return nil, nil, errors.Wrapf(err, "error creating schema json: %s", err)
	}
	schema, err := createSchemaValidator(JSONSchema)
	if err != nil {
		return nil, nil, errors.Wrapf(err, "error creating schema validator: %s", err)
	}
	return JSONSchema, schema, nil
}

func createJSONSchema(anySchema interface{}) ([]byte, error) {
	r := new(jsonschema.Reflector)
	r.RequiredFromJSONSchemaTags = true
	err := r.AddGoComments("github.com/B-S-F/yaku/onyx", "./")
	if err != nil {
		return nil, errors.Wrapf(err, "error adding go comments in schema: %s", err)
	}
	s := r.Reflect(anySchema)
	JSONSchema, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return nil, errors.Wrapf(err, "error marshalling schema: %s", err)
	}
	return JSONSchema, nil
}

func createSchemaValidator(JSONschema []byte) (*gojsonschema.Schema, error) {
	schemaLoader := gojsonschema.NewBytesLoader(JSONschema)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, errors.Wrapf(err, "error creating schema: %s", err)
	}
	return schema, nil
}
