package curl

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewConfig(t *testing.T) {

	t.Run("basic", func(t *testing.T) {
		configMap := map[string]interface{}{
			"url": "http://example.com/{name}/{version}",
		}
		config, err := newConfig(configMap)
		assert.NoError(t, err)
		assert.Equal(t, "curl", config.Type())

		concreteConfig, ok := config.(Config)
		assert.True(t, ok)
		assert.Equal(t, "http://example.com/{name}/{version}", concreteConfig.URL)
	})

	t.Run("with auth", func(t *testing.T) {
		configMap := map[string]interface{}{
			"url": "http://example.com/{name}/{version}",
			"auth": map[string]interface{}{
				"type":     "basic",
				"username": "testUser",
				"password": "testPass",
			},
		}
		config, err := newConfig(configMap)
		assert.NoError(t, err)
		assert.Equal(t, "curl", config.Type())

		concreteConfig, ok := config.(Config)
		assert.True(t, ok)
		assert.Equal(t, "http://example.com/{name}/{version}", concreteConfig.URL)
		assert.NotNil(t, concreteConfig.Auth)
		assert.Equal(t, BasicAuthType, concreteConfig.Auth.Type)
	})

	t.Run("with missing url", func(t *testing.T) {
		configMap := map[string]interface{}{
			"auth": map[string]interface{}{
				"type":     "basic",
				"username": "testUser",
				"password": "testPass",
			},
		}
		_, err := newConfig(configMap)
		assert.Error(t, err)
		assert.Equal(t, "missing 'url' in config", err.Error())
	})

	t.Run("with invalid auth type", func(t *testing.T) {
		configMap := map[string]interface{}{
			"url": "http://example.com/{name}/{version}",
			"auth": map[string]interface{}{
				"type": "unknown",
			},
		}
		_, err := newConfig(configMap)
		assert.Error(t, err)
		assert.Equal(t, "error creating auth: auth type unknown is not supported, supported auth types are [basic token]", err.Error())
	})
}
