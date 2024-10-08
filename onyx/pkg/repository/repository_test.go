package repository

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/stretchr/testify/assert"
)

type MockRepository struct{}

func (m *MockRepository) InstallApp(appReference *app.Reference) (app.App, error) {
	return nil, nil
}

func (m *MockRepository) Name() string {
	return "mock"
}

func NewMockRepository(name string, installationPath string, config map[string]interface{}) (Repository, error) {
	return &MockRepository{}, nil
}

func TestRepositoryFactory(t *testing.T) {
	factory := NewRepositoryFactory()
	assert.NotNil(t, factory)

	factory.Register("mock", NewMockRepository)
	t.Run("New", func(t *testing.T) {
		t.Run("Valid", func(t *testing.T) {
			repo, err := factory.New("mock", "mock", nil)
			assert.Nil(t, err)
			assert.NotNil(t, repo)
		})

		t.Run("Invalid", func(t *testing.T) {
			repo, err := factory.New("invalid", "invalid", nil)
			assert.NotNil(t, err)
			assert.Nil(t, repo)
		})
	})
}
