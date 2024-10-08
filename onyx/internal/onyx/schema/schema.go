package schema

import (
	"github.com/B-S-F/onyx/internal/onyx/common"
	v1 "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/B-S-F/onyx/pkg/schema"
	v2 "github.com/B-S-F/onyx/pkg/v2/result"
	"github.com/pkg/errors"
)

func Schema(kind, version, output string) error {
	schemaJSON, err := runSchema(kind, version)
	if err != nil {
		return errors.Wrapf(err, "error creating schema for kind %s and version %s", kind, version)
	}
	out := common.SelectOutputWriter(output)
	_, err = out.Write(schemaJSON)
	if err != nil {
		return errors.Wrapf(err, "error writing schema to output")
	}
	defer out.Close()
	return nil
}

func runSchema(kind, version string) ([]byte, error) {
	switch kind {
	case "config":
		return runConfigSchema(version, &common.ConfigCreatorImpl{}, &schema.Schema{})
	case "result":
		return runResultSchema(version, &schema.Schema{})
	default:
		return nil, errors.Errorf("unknown schema kind %s", kind)
	}
}

func runConfigSchema(version string, configCreator common.ConfigCreator, schema schema.SchemaHandler) ([]byte, error) {
	config, err := configCreator.Empty(version)
	if err != nil {
		return nil, err
	}
	err = schema.Load(config)
	if err != nil {
		return nil, errors.Wrapf(err, "error loading schema for version	%s", version)
	}
	return schema.JSON(), nil
}

func runResultSchema(version string, schema schema.SchemaHandler) ([]byte, error) {
	var result interface{}
	switch version {
	case "v1":
		result = v1.Result{}
	case "v2":
		result = v2.Result{}
	default:
		return nil, errors.Errorf("unknown result version %s", version)
	}
	err := schema.Load(result)
	if err != nil {
		return nil, errors.Wrap(err, "error loading result schema")
	}
	return schema.JSON(), nil
}
