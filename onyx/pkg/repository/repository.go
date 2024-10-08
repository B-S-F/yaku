package repository

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/B-S-F/onyx/pkg/tempdir"
)

var REPOSITORY_DIRECTORY = tempdir.GetPath("repositories")

type Config interface {
	Type() string
}

type Repository interface {
	InstallApp(*app.Reference) (app.App, error)
	Name() string
}

type RepositoryFactory struct {
	toRepository map[string]func(name string, installationPath string, config map[string]interface{}) (Repository, error)
}

func (r *RepositoryFactory) New(name string, typeName string, config map[string]interface{}) (Repository, error) {
	if toRepository, ok := r.toRepository[typeName]; ok {
		return toRepository(name, REPOSITORY_DIRECTORY, config)
	}
	return nil, fmt.Errorf("unsupported repository type: %s", typeName)
}

func (r *RepositoryFactory) Register(typeName string, conversion func(name string, installationPath string, config map[string]interface{}) (Repository, error)) {
	r.toRepository[typeName] = conversion
}

func NewRepositoryFactory() *RepositoryFactory {
	return &RepositoryFactory{
		toRepository: make(map[string]func(name string, installationPath string, config map[string]interface{}) (Repository, error)),
	}
}
