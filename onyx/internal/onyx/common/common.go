package common

import (
	"fmt"
	"io"
	"os"

	"github.com/B-S-F/onyx/pkg/configuration"
	v0 "github.com/B-S-F/onyx/pkg/configuration/versions/v0"
	v1 "github.com/B-S-F/onyx/pkg/configuration/versions/v1"
	"github.com/B-S-F/onyx/pkg/logger"
	v2 "github.com/B-S-F/onyx/pkg/v2/config"
	"github.com/pkg/errors"
	yaml "gopkg.in/yaml.v3"
)

type ConfigCreator interface {
	Empty(version string) (interface{}, error)
	New(version string, content []byte) (interface{}, error)
}

type ConfigCreatorImpl struct{}

func (c *ConfigCreatorImpl) Empty(version string) (interface{}, error) {
	switch version {
	case "v0":
		return v0.Config{}, nil
	case "v1":
		return v1.Config{}, nil
	case "v2":
		return v2.Config{}, nil
	default:
		return nil, fmt.Errorf("version %s not supported", version)
	}
}

func (c *ConfigCreatorImpl) New(version string, content []byte) (interface{}, error) {
	switch version {
	case "v0":
		return v0.New(content)
	case "v1":
		return v1.New(content)
	case "v2":
		return v2.New(content)
	default:
		return nil, fmt.Errorf("version %s not supported", version)
	}
}

func ReadConfigVersion(content []byte) (string, error) {
	var cfg configuration.ConfigData
	err := yaml.Unmarshal(content, &cfg)
	if err != nil {
		return "", err
	}
	return cfg.Metadata.Version, nil
}

func SelectOutputWriter(output string) io.WriteCloser {
	logger := logger.Get()
	if output == "stdout" || output == "" {
		return os.Stdout
	}
	writer, err := os.Create(output)
	if err != nil {
		logger.Warn(errors.Wrapf(err, "error creating output file '%s', using 'stdout'", output).Error())
		return os.Stdout
	}
	return writer
}
