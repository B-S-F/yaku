package registry

import (
	"errors"
	"testing"

	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/stretchr/testify/assert"
)

type MockApp struct{}

func (m *MockApp) Reference() *app.Reference {
	return nil
}

func (m *MockApp) Checksum() string {
	return "abcdef"
}

func (m *MockApp) ExecutablePath() string {
	return "/path/to/executable"
}

func (m *MockApp) PossibleReferences() []string {
	return []string{"mockapp@1.0.0", "mockapp"}
}

type MockRepository struct {
	RepositoryName string
}

func (m *MockRepository) InstallApp(appReference *app.Reference) (app.App, error) {
	return nil, errors.New("not implemented")
}

func (m *MockRepository) Name() string {
	return m.RepositoryName
}

func TestNewRegistry(t *testing.T) {
	// Create mock repositories
	mockRepo1 := &MockRepository{
		RepositoryName: "MockRepo1",
	}
	mockRepo2 := &MockRepository{
		RepositoryName: "MockRepo2",
	}

	repositories := []repository.Repository{
		mockRepo1,
		mockRepo2,
	}

	// Create a new registry with the mock repositories
	registry := NewRegistry(repositories)

	// Assert that the registry is not nil
	assert.NotNil(t, registry)
	// Assert that the number of repositories in the registry matches the number of mock repositories
	assert.Equal(t, len(repositories), len(registry.repositories))
}

func TestGet(t *testing.T) {
	appReference := app.Reference{
		Repository: "MockRepo1",
		Name:       "MockApp",
		Version:    "1.0.0",
	}

	appReferenceNoRepo := app.Reference{
		Name:    "MockApp",
		Version: "1.0.0",
	}

	nonExistingAppReference := app.Reference{
		Repository: "MockRepo1",
		Name:       "NonExistingApp",
		Version:    "1.0.0",
	}

	registry := Registry{
		repositories: map[string]repository.Repository{
			"MockRepo1": &MockRepository{
				RepositoryName: "MockRepo1",
			},
		},
		repositoryApps: map[string]app.App{
			"MockRepo1::MockApp@1.0.0": &MockApp{},
			"MockApp@latest":           &MockApp{},
		},
	}

	app, err := registry.Get(&appReference)
	assert.Nil(t, err)
	assert.NotNil(t, app)

	app, err = registry.Get(&appReferenceNoRepo)
	assert.NotNil(t, err)
	assert.Nil(t, app)

	app, err = registry.Get(&nonExistingAppReference)
	assert.NotNil(t, err)
	assert.Nil(t, app)
}

func TestStats(t *testing.T) {
	registry := Registry{
		repositories: map[string]repository.Repository{
			"MockRepo1": &MockRepository{
				RepositoryName: "MockRepo1",
			},
		},
		repositoryApps: map[string]app.App{
			"MockRepo1::MockApp@1.0.0": &MockApp{},
			"MockApp@latest":           &MockApp{},
		},
	}

	stats := registry.Stats()
	assert.NotEmpty(t, stats)
	assert.Equal(t, stats, "Number of apps: 2")
}
