package azblob

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig(t *testing.T) {
	t.Run("Type", func(t *testing.T) {
		config := &Config{}
		assert.Equal(t, "azure-blob-storage", config.Type())
	})

	t.Run("NewConfig", func(t *testing.T) {
		t.Run("SharedAccessSignature", func(t *testing.T) {
			config, err := newConfig(map[string]interface{}{
				"storage_account_name":      "testAccount",
				"storage_account_container": "testContainer",
				"storage_account_path":      "testPath",
				"auth": map[string]interface{}{
					"type":      "storage_account_signature",
					"signature": "testSignature",
				},
			})

			assert.NoError(t, err)
			assert.Equal(t, "testAccount", config.(*Config).StorageAccountName)
			assert.Equal(t, "testContainer", config.(*Config).StorageAccountContainer)
			assert.Equal(t, "testPath", config.(*Config).StorageAccountPath)
			assert.Equal(t, SharedAccessSignatureAuthType, config.(*Config).Auth.Type)
		})

		t.Run("ClientSecret", func(t *testing.T) {
			config, err := newConfig(map[string]interface{}{
				"storage_account_name":      "testAccount",
				"storage_account_container": "testContainer",
				"storage_account_path":      "testPath",
				"auth": map[string]interface{}{
					"type":          "client_secret",
					"client_id":     "testClientID",
					"client_secret": "testClientSecret",
					"tenant_id":     "testTenantID",
				},
			})

			assert.NoError(t, err)
			assert.Equal(t, "testAccount", config.(*Config).StorageAccountName)
			assert.Equal(t, "testContainer", config.(*Config).StorageAccountContainer)
			assert.Equal(t, "testPath", config.(*Config).StorageAccountPath)
			assert.Equal(t, ClientSecretAuthType, config.(*Config).Auth.Type)
		})

		t.Run("Missing storage_account_name", func(t *testing.T) {
			_, err := newConfig(map[string]interface{}{
				"storage_account_container": "testContainer",
				"storage_account_path":      "testPath",
				"auth": map[string]interface{}{
					"type":      "storage_account_signature",
					"signature": "testSignature",
				},
			})

			assert.Error(t, err)
			assert.Equal(t, "missing 'storage_account_name' in config", err.Error())
		})

		t.Run("Missing storage_account_container", func(t *testing.T) {
			_, err := newConfig(map[string]interface{}{
				"storage_account_name": "testAccount",
				"storage_account_path": "testPath",
				"auth": map[string]interface{}{
					"type":      "storage_account_signature",
					"signature": "testSignature",
				},
			})

			assert.Error(t, err)
			assert.Equal(t, "missing 'storage_account_container' in config", err.Error())
		})

		t.Run("Missing storage_account_path", func(t *testing.T) {
			_, err := newConfig(map[string]interface{}{
				"storage_account_name":      "testAccount",
				"storage_account_container": "testContainer",
				"auth": map[string]interface{}{
					"type":      "storage_account_signature",
					"signature": "testSignature",
				},
			})

			assert.Error(t, err)
			assert.Equal(t, "missing 'storage_account_path' in config", err.Error())
		})

		t.Run("Missing auth", func(t *testing.T) {
			_, err := newConfig(map[string]interface{}{
				"storage_account_name":      "testAccount",
				"storage_account_container": "testContainer",
				"storage_account_path":      "testPath",
			})

			assert.Error(t, err)
			assert.Equal(t, "missing 'auth' in config", err.Error())
		})
	})
}
