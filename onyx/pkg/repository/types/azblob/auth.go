package azblob

import (
	"context"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

type AuthType string

const (
	ClientSecretAuthType          AuthType = "client_secret"
	OnBehalfOfAuthType            AuthType = "on_behalf_of"
	SharedAccessSignatureAuthType AuthType = "storage_account_signature"
)

type Auth struct {
	// Type of the authentication
	Type AuthType
	// Config of the authentication
	Config AuthConfig
}

type AuthConfig interface {
	// Token returns the token credential for the configured authentication method (if possible)
	Token(ctx context.Context) (azcore.TokenCredential, error)
	// StorageAccountSignature returns the storage account signature for the configured authentication method (if possible)
	StorageAccountSignature() (string, error)
}

var supportedAuthTypes = []AuthType{ClientSecretAuthType, OnBehalfOfAuthType, SharedAccessSignatureAuthType}

const clientIDKey = "client_id"
const clientSecretKey = "client_secret"
const tenantIDKey = "tenant_id"
const sasKey = "signature"

type AuthFactory struct {
	toAuthConfig map[AuthType]func(map[string]interface{}) (AuthConfig, error)
}

func newAuthFactory() *AuthFactory {
	toAuthConfig := make(map[AuthType]func(map[string]interface{}) (AuthConfig, error))
	toAuthConfig[ClientSecretAuthType] = newClientSecretAuth
	toAuthConfig[SharedAccessSignatureAuthType] = newSharedAccessSignatureAuth
	return &AuthFactory{
		toAuthConfig: toAuthConfig,
	}
}

// newAuth creates a new Auth object based on the given config
func (f *AuthFactory) newAuth(config map[string]interface{}) (*Auth, error) {
	authType, ok := config["type"].(string)
	if !ok {
		return nil, fmt.Errorf("auth type must be a string")
	}
	toAuthConfig, ok := f.toAuthConfig[AuthType(authType)]
	if !ok {
		return nil, fmt.Errorf("auth type %s is not supported, supported auth types are %v", authType, supportedAuthTypes)
	}
	authConfig, err := toAuthConfig(config)
	if err != nil {
		return nil, fmt.Errorf("error creating auth: %w", err)
	}
	return &Auth{
		Type:   AuthType(authType),
		Config: authConfig,
	}, nil
}

type ClientSecretAuth struct {
	ClientID     string
	ClientSecret string
	TenantID     string
}

func newClientSecretAuth(config map[string]interface{}) (AuthConfig, error) {
	if config[clientIDKey] == nil {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", clientIDKey)
	}
	if config[clientSecretKey] == nil {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", clientSecretKey)
	}
	if config[tenantIDKey] == nil {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", tenantIDKey)
	}

	clientID, ok := config[clientIDKey].(string)
	if !ok {
		return ClientSecretAuth{}, fmt.Errorf("%s must be a string", clientIDKey)
	}
	clientSecret, ok := config[clientSecretKey].(string)
	if !ok {
		return ClientSecretAuth{}, fmt.Errorf("%s must be a string", clientSecretKey)
	}
	tenantID, ok := config[tenantIDKey].(string)
	if !ok {
		return ClientSecretAuth{}, fmt.Errorf("%s must be a string", tenantIDKey)
	}

	if clientID == "" {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", clientIDKey)
	}
	if clientSecret == "" {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", clientSecretKey)
	}
	if tenantID == "" {
		return ClientSecretAuth{}, fmt.Errorf("missing '%s' in client secret auth config", tenantIDKey)
	}

	return ClientSecretAuth{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		TenantID:     tenantID,
	}, nil
}

func (c ClientSecretAuth) Token(ctx context.Context) (azcore.TokenCredential, error) {
	return azidentity.NewClientSecretCredential(c.TenantID, c.ClientID, c.ClientSecret, nil)
}

func (c ClientSecretAuth) StorageAccountSignature() (string, error) {
	return "", fmt.Errorf("StorageAccountSignature is not supported for client secret auth")
}

type SharedAccessSignatureAuth struct {
	storageAccountSignature string
}

func newSharedAccessSignatureAuth(config map[string]interface{}) (AuthConfig, error) {
	if config[sasKey] == nil {
		return SharedAccessSignatureAuth{}, fmt.Errorf("missing %s in connection string auth config", sasKey)
	}
	sas, ok := config[sasKey].(string)
	if !ok {
		return SharedAccessSignatureAuth{}, fmt.Errorf("%s must be a string", sasKey)
	}
	if sas == "" {
		return SharedAccessSignatureAuth{}, fmt.Errorf("missing %s in connection string auth config", sasKey)
	}
	return SharedAccessSignatureAuth{
		storageAccountSignature: sas,
	}, nil
}

func (c SharedAccessSignatureAuth) Token(ctx context.Context) (azcore.TokenCredential, error) {
	return nil, fmt.Errorf("Token is not supported for shared access signature auth")
}

func (c SharedAccessSignatureAuth) StorageAccountSignature() (string, error) {
	return c.storageAccountSignature, nil
}
