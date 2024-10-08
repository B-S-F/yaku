package azblob

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/repository"
)

const StorageAccountNameKey = "storage_account_name"
const StorageAccountContainerKey = "storage_account_container"
const StorageAccountPathKey = "storage_account_path"

type Config struct {
	StorageAccountName      string
	StorageAccountContainer string
	StorageAccountPath      string
	Auth                    *Auth
}

func (c *Config) Type() string {
	return "azure-blob-storage"
}

func newConfig(config map[string]interface{}) (repository.Config, error) {
	authFactory := newAuthFactory()
	if config[StorageAccountNameKey] == nil {
		return nil, fmt.Errorf("missing 'storage_account_name' in config")
	}
	if config[StorageAccountContainerKey] == nil {
		return nil, fmt.Errorf("missing 'storage_account_container' in config")
	}
	if config[StorageAccountPathKey] == nil {
		return nil, fmt.Errorf("missing 'storage_account_path' in config")
	}
	if config["auth"] == nil {
		return nil, fmt.Errorf("missing 'auth' in config")
	}
	auth, err := authFactory.newAuth(config["auth"].(map[string]interface{}))
	if err != nil {
		return nil, fmt.Errorf("error creating auth: %w", err)
	}
	return &Config{
		StorageAccountName:      config[StorageAccountNameKey].(string),
		StorageAccountContainer: config[StorageAccountContainerKey].(string),
		StorageAccountPath:      config[StorageAccountPathKey].(string),
		Auth:                    auth,
	}, nil
}
