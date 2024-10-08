package azblob

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuth(t *testing.T) {
	authFactory := newAuthFactory()

	t.Run("Storage Access Signature", func(t *testing.T) {
		t.Run("Valid", func(t *testing.T) {
			config := map[string]interface{}{
				"type":      "storage_account_signature",
				"signature": "testSignature",
			}
			auth, err := authFactory.newAuth(config)

			assert.NoError(t, err)
			assert.Equal(t, SharedAccessSignatureAuthType, auth.Type)
			assert.NotNil(t, auth.Config)

			signature, err := auth.Config.StorageAccountSignature()
			assert.NoError(t, err)
			assert.Equal(t, "testSignature", signature)

			token, err := auth.Config.Token(nil)
			assert.Error(t, err)
			assert.Nil(t, token)
		})

		t.Run("Missing signature", func(t *testing.T) {
			config := map[string]interface{}{
				"type": "storage_account_signature",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing signature in connection string auth config", err.Error())
		})

		t.Run("Empty signature", func(t *testing.T) {
			config := map[string]interface{}{
				"type":      "storage_account_signature",
				"signature": "",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing signature in connection string auth config", err.Error())
		})
	})

	t.Run("Client Credentials", func(t *testing.T) {
		t.Run("Valid", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_id":     "testClientID",
				"client_secret": "testClientSecret",
				"tenant_id":     "testTenantID",
			}
			auth, err := authFactory.newAuth(config)

			assert.NoError(t, err)
			assert.Equal(t, ClientSecretAuthType, auth.Type)
			assert.NotNil(t, auth.Config)

			ctx := context.Background()
			token, err := auth.Config.Token(ctx)
			assert.NoError(t, err)
			assert.NotNil(t, token)

			signature, err := auth.Config.StorageAccountSignature()
			assert.Error(t, err)
			assert.Equal(t, "", signature)
		})

		t.Run("Missing client_id", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_secret": "testClient",
				"tenant_id":     "testTenantID",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'client_id' in client secret auth config", err.Error())
		})

		t.Run("Missing client_secret", func(t *testing.T) {
			config := map[string]interface{}{
				"type":      "client_secret",
				"client_id": "testClientID",
				"tenant_id": "testTenantID",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'client_secret' in client secret auth config", err.Error())
		})

		t.Run("Missing tenant_id", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_id":     "testClientID",
				"client_secret": "testClientSecret",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'tenant_id' in client secret auth config", err.Error())
		})

		t.Run("Empty client_id", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_id":     "",
				"client_secret": "testClient",
				"tenant_id":     "testTenantID",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'client_id' in client secret auth config", err.Error())
		})

		t.Run("Empty client_secret", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_id":     "testClientID",
				"client_secret": "",
				"tenant_id":     "testTenantID",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'client_secret' in client secret auth config", err.Error())
		})

		t.Run("Empty tenant_id", func(t *testing.T) {
			config := map[string]interface{}{
				"type":          "client_secret",
				"client_id":     "testClientID",
				"client_secret": "testClient",
				"tenant_id":     "",
			}
			_, err := authFactory.newAuth(config)

			assert.Error(t, err)
			assert.Equal(t, "error creating auth: missing 'tenant_id' in client secret auth config", err.Error())
		})
	})

	t.Run("Unknown type", func(t *testing.T) {
		config := map[string]interface{}{
			"type": "unknown",
		}
		_, err := authFactory.newAuth(config)

		assert.Error(t, err)
		assert.Equal(t, "auth type unknown is not supported, supported auth types are [client_secret on_behalf_of storage_account_signature]", err.Error())
	})
}
