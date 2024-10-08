package exec

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/types/azblob"
	"github.com/B-S-F/onyx/pkg/repository/types/curl"
)

func initializeRepository(repositories []configuration.Repository) ([]repository.Repository, error) {
	var parseErrs []error
	var registryRepositories []repository.Repository
	repositoryFactory := repository.NewRepositoryFactory()
	repositoryFactory.Register("curl", curl.NewRepository)
	repositoryFactory.Register("azure-blob-storage", azblob.NewRepository)
	for index := range repositories {
		configRepository := repositories[index]
		repository, err := repositoryFactory.New(configRepository.Name, configRepository.Type, configRepository.Config)
		if err != nil {
			parseErrs = append(parseErrs, fmt.Errorf("error creating repository %s: %w", configRepository.Name, err))
			break
		}
		registryRepositories = append(registryRepositories, repository)
	}
	if len(parseErrs) > 0 {
		return nil, fmt.Errorf("error initializing repositories: %v", parseErrs)
	}
	return registryRepositories, nil
}
