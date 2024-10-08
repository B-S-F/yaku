package curl

import (
	"encoding/base64"
	"fmt"
)

type AuthType string

const (
	BasicAuthType AuthType = "basic"
	TokenAuthType AuthType = "token"
)

type Auth struct {
	// Type of the authentication
	Type AuthType
	// Config of the authentication
	Config AuthConfig
}

type AuthConfig interface {
	// Get the authentication header
	Header() string
}

var supportedAuthTypes = []AuthType{BasicAuthType, TokenAuthType}

type AuthFactory struct {
	toAuthConfig map[AuthType]func(map[string]interface{}) (AuthConfig, error)
}

func newAuthFactory() *AuthFactory {
	toAuthConfig := make(map[AuthType]func(map[string]interface{}) (AuthConfig, error))
	toAuthConfig[BasicAuthType] = newBasicAuth
	toAuthConfig[TokenAuthType] = newTokenAuth
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

type BasicAuth struct {
	Username string
	Password string
}

func newBasicAuth(config map[string]interface{}) (AuthConfig, error) {
	if config["username"] == nil {
		return BasicAuth{}, fmt.Errorf("missing 'username' in basic auth config")
	}
	if config["password"] == nil {
		return BasicAuth{}, fmt.Errorf("missing 'password' in basic auth config")
	}
	username, ok := config["username"].(string)
	if !ok {
		return BasicAuth{}, fmt.Errorf("username must be a string")
	}
	password, ok := config["password"].(string)
	if !ok {
		return BasicAuth{}, fmt.Errorf("password must be a string")
	}
	return BasicAuth{
		Username: username,
		Password: password,
	}, nil
}

func (b BasicAuth) Header() string {
	base64Encoded := base64.StdEncoding.EncodeToString([]byte(b.Username + ":" + b.Password))
	return "Basic " + base64Encoded
}

type TokenAuth struct {
	Token string
}

func newTokenAuth(config map[string]interface{}) (AuthConfig, error) {
	if config["token"] == nil {
		return TokenAuth{}, fmt.Errorf("missing 'token' in token auth config")
	}
	token, ok := config["token"].(string)
	if !ok {
		return TokenAuth{}, fmt.Errorf("token must be a string")
	}
	return TokenAuth{
		Token: token,
	}, nil
}

func (t TokenAuth) Header() string {
	return "Bearer " + t.Token
}
