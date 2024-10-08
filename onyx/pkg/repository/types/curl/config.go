package curl

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/repository"
)

type Config struct {
	// URL of the file to download
	// Example "https://my-file-server.com/{app-name}-{app-version}.tar.gz"
	URL string
	// Auth configuration
	Auth *Auth
}

func (c Config) Type() string {
	return "curl"
}

func newConfig(config map[string]interface{}) (repository.Config, error) {
	authFactory := newAuthFactory()
	if config["url"] == nil {
		return nil, fmt.Errorf("missing 'url' in config")
	}
	if config["auth"] == nil {
		return Config{
			URL: config["url"].(string),
		}, nil
	}
	auth, err := authFactory.newAuth(config["auth"].(map[string]interface{}))
	if err != nil {
		return nil, fmt.Errorf("error creating auth: %w", err)
	}
	return Config{
		URL:  config["url"].(string),
		Auth: auth,
	}, nil
}
