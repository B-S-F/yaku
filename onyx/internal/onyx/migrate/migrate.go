package migrate

import (
	"fmt"
	"os"

	"github.com/B-S-F/onyx/internal/onyx/common"
	v0 "github.com/B-S-F/onyx/pkg/configuration/versions/v0"
	v1 "github.com/B-S-F/onyx/pkg/configuration/versions/v1"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/pkg/errors"
)

func Migrate(targetVersion, configFile, output string) error {
	logger := logger.Get()
	configContent, err := os.ReadFile(configFile)
	if err != nil {
		return errors.Wrapf(err, "error reading config file %s", configFile)
	}
	configVersion, err := common.ReadConfigVersion(configContent)
	if err != nil {
		logger.Warn(errors.Wrap(err, "error reading config version from config file").Error())
	}
	logger.Info(fmt.Sprintf("migrating from version '%s' to version '%s'", configVersion, targetVersion))
	configuration, err := runMigrate(configVersion, targetVersion, configContent)
	if err != nil {
		return errors.Wrap(err, "error migrating config file")
	}
	writer := common.SelectOutputWriter(output)
	_, err = writer.Write(configuration)
	if err != nil {
		return errors.Wrapf(err, "error writing config to output")
	}
	logger.Info(fmt.Sprintf("config file '%s' migrated to version '%s'", configFile, targetVersion))
	return nil
}

func runMigrate(currentVersion string, targetVersion string, content []byte) ([]byte, error) {
	logger := logger.Get()
	if currentVersion == targetVersion {
		return nil, errors.New("current version is the same as target version, skipping migration")
	}
	for currentVersion != targetVersion {
		switch currentVersion {
		case "v0":
			cfg, err := v0.New(content)
			if err != nil {
				return nil, err
			}
			content, err = cfg.Migrate()
			if err != nil {
				return nil, err
			}
			currentVersion = "v1"

		case "v1":
			cfg, err := v1.New(content)
			if err != nil {
				return nil, err
			}
			content, err = cfg.Migrate()
			if err != nil {
				return nil, err
			}
			currentVersion = "v2"
		case "v2":
			return nil, errors.New("cannot migrate to any higher version than v2")
		default:
			logger.Info("No metadata found, trying to use v0")
			currentVersion = "v0"
		}
	}
	return content, nil
}
