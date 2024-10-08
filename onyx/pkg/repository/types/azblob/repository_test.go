package azblob

import (
	"testing"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/stretchr/testify/assert"
)

func TestRepository(t *testing.T) {
	t.Run("NewRepository", func(t *testing.T) {
		t.Run("should create repository", func(t *testing.T) {
			t.Run("SharedAccessSignature", func(t *testing.T) {
				repo, err := NewRepository("name", "/test/path", map[string]interface{}{
					"storage_account_name":      "testAccount",
					"storage_account_container": "testContainer",
					"storage_account_path":      "testPath",
					"auth": map[string]interface{}{
						"type":      "storage_account_signature",
						"signature": "testSignature",
					},
				})

				assert.NoError(t, err)
				assert.Equal(t, "name", repo.Name())
				assert.Equal(t, "/test/path", repo.(*Repository).InstallationPath)
				assert.Equal(t, "testAccount", repo.(*Repository).Config.StorageAccountName)
			})

			t.Run("ClientSecret", func(t *testing.T) {
				repo, err := NewRepository("name", "/test/path", map[string]interface{}{
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
				assert.Equal(t, "name", repo.Name())
				assert.Equal(t, "/test/path", repo.(*Repository).InstallationPath)
				assert.Equal(t, "testAccount", repo.(*Repository).Config.StorageAccountName)
			})
		})

		t.Run("should fail to create repository", func(t *testing.T) {
			t.Run("with invalid config", func(t *testing.T) {
				_, err := NewRepository("name", "/test/path", map[string]interface{}{
					"storage_account_container": "testContainer",
					"storage_account_path":      "testPath",
					"auth": map[string]interface{}{
						"type":      "storage_account_signature",
						"signature": "testSignature",
					},
				})

				assert.Error(t, err)
				assert.Equal(t, "failed to create config: missing 'storage_account_name' in config", err.Error())
			})

			t.Run("with nil config", func(t *testing.T) {
				_, err := NewRepository("name", "/test/path", nil)
				assert.Error(t, err)
				assert.Equal(t, "config is nil", err.Error())
			})

			t.Run("with invalid auth type", func(t *testing.T) {
				_, err := NewRepository("name", "/test/path", map[string]interface{}{
					"storage_account_name":      "testAccount",
					"storage_account_container": "testContainer",
					"storage_account_path":      "testPath",
					"auth": map[string]interface{}{
						"type": "invalid",
					},
				})

				assert.Error(t, err)
			})
		})
	})

	t.Run("initClient", func(t *testing.T) {
		t.Run("SharedAccessSignature", func(t *testing.T) {
			repository := &Repository{
				Config: Config{
					StorageAccountName:      "testAccount",
					StorageAccountContainer: "testContainer",
					StorageAccountPath:      "testPath",
				},
				StorageAccountSignature: "testSignature",
			}

			client, err := repository.initClient()
			assert.NoError(t, err)
			assert.NotNil(t, client)
		})

		t.Run("ClientSecret", func(t *testing.T) {
			repository := &Repository{
				Config: Config{
					StorageAccountName:      "testAccount",
					StorageAccountContainer: "testContainer",
					StorageAccountPath:      "testPath",
				},
				Token: &azidentity.ClientSecretCredential{},
			}

			client, err := repository.initClient()
			assert.NoError(t, err)
			assert.NotNil(t, client)
		})

		t.Run("should fail to init client if no auth method is set", func(t *testing.T) {
			repository := &Repository{
				Config: Config{
					StorageAccountName:      "testAccount",
					StorageAccountContainer: "testContainer",
					StorageAccountPath:      "testPath",
				},
			}

			_, err := repository.initClient()
			assert.Error(t, err)
			assert.Equal(t, "no authorization options provided", err.Error())
		})
	})

	t.Run("getAppPath", func(t *testing.T) {
		repository := &Repository{
			Config: Config{
				StorageAccountName:      "testAccount",
				StorageAccountContainer: "testContainer",
				StorageAccountPath:      "{name}/{version}",
			},
		}

		t.Run("should return app path", func(t *testing.T) {
			path, err := repository.getAppPath("testApp", "testVersion")
			assert.NoError(t, err)
			assert.Equal(t, "testApp/testVersion", path)
		})

		t.Run("should fail to get app path if {name} is not set in StorageAccountPath", func(t *testing.T) {
			repository.Config.StorageAccountPath = "{version}"
			_, err := repository.getAppPath("testApp", "testVersion")
			assert.Error(t, err)
			assert.Equal(t, "storage account path does not contain {name} placeholder", err.Error())
		})

		t.Run("should fail to get app path if {version} is not set in StorageAccountPath", func(t *testing.T) {
			repository.Config.StorageAccountPath = "{name}"
			_, err := repository.getAppPath("testApp", "testVersion")
			assert.Error(t, err)
			assert.Equal(t, "storage account path does not contain {version} placeholder", err.Error())
		})

		t.Run("should fail to get app path if StorageAccountPath is empty", func(t *testing.T) {
			repository.Config.StorageAccountPath = ""
			_, err := repository.getAppPath("testApp", "testVersion")
			assert.Error(t, err)
			assert.Equal(t, "storage account path is not set", err.Error())
		})
	})

	t.Run("serviceUrl", func(t *testing.T) {
		repository := &Repository{
			Config: Config{
				StorageAccountName:      "testAccount",
				StorageAccountContainer: "testContainer",
				StorageAccountPath:      "{name}/{version}",
			},
		}

		t.Run("should return service URL", func(t *testing.T) {
			url := repository.serviceUrl()
			assert.Equal(t, "https://testAccount.blob.core.windows.net", url)
		})
	})
}
