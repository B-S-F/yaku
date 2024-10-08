package curl

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuth(t *testing.T) {
	authFactory := newAuthFactory()

	t.Run("basic", func(t *testing.T) {
		config := map[string]interface{}{
			"type":     "basic",
			"username": "testUser",
			"password": "testPass",
		}
		auth, err := authFactory.newAuth(config)

		assert.NoError(t, err)
		assert.Equal(t, BasicAuthType, auth.Type)
		assert.Equal(t, "Basic dGVzdFVzZXI6dGVzdFBhc3M=", auth.Config.Header())
		assert.NotNil(t, auth.Config)
	})

	t.Run("token", func(t *testing.T) {
		config := map[string]interface{}{
			"type":  "token",
			"token": "testToken",
		}
		auth, err := authFactory.newAuth(config)

		assert.NoError(t, err)
		assert.Equal(t, TokenAuthType, auth.Type)
		assert.Equal(t, "Bearer testToken", auth.Config.Header())
		assert.NotNil(t, auth.Config)
	})

	t.Run("unknown type", func(t *testing.T) {
		config := map[string]interface{}{
			"type": "unknown",
		}
		_, err := authFactory.newAuth(config)

		assert.Error(t, err)
		assert.Equal(t, "auth type unknown is not supported, supported auth types are [basic token]", err.Error())
	})

}
