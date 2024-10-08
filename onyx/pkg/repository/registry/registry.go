package registry

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
)

type Registry struct {
	logger         logger.Logger
	repositoryApps map[string]app.App
	repositories   map[string]repository.Repository
}

func NewRegistry(repositories []repository.Repository) *Registry {
	registryRepositories := make(map[string]repository.Repository)
	for _, repository := range repositories {
		registryRepositories[repository.Name()] = repository
	}
	return &Registry{
		logger:         logger.Get(),
		repositoryApps: make(map[string]app.App),
		repositories:   registryRepositories,
	}
}

func (r *Registry) Install(reference *app.Reference) error {
	if ok := r.repositoryApps[r.hashKey(reference)]; ok != nil {
		r.logger.Infof("app.App %s already installed", reference)
		return nil
	}

	if reference.Repository == "" {
		r.logger.Debugf("No repository specified for app %s", reference)
		return r.tryInstallFromAllRepositories(reference)
	}

	return r.installFromRepository(reference)
}

// tryInstallFromAllRepositories tries to install the app from all repositories.
// If the app is found in multiple repositories, an error is returned.
func (r *Registry) tryInstallFromAllRepositories(appReferences *app.Reference) error {
	r.logger.Debugf("Installing app %s from all repositories", appReferences)
	var installationErrors []error
	var foundApps []app.App = make([]app.App, 0)
	for _, repository := range r.repositories {
		app, err := repository.InstallApp(appReferences)
		if err != nil {
			r.logger.Debugf("Failed to install app %s from repository %s: %v", appReferences, repository.Name(), err)
			installationErrors = append(installationErrors, fmt.Errorf("repository %s: %v", repository.Name(), err))
			continue
		}
		foundApps = append(foundApps, app)
	}
	if len(foundApps) == 0 {
		err := fmt.Errorf("app %s could not be downloaded from any repository:", appReferences)
		for _, installationError := range installationErrors {
			err = fmt.Errorf("%w\n\t%v", err, installationError)
		}
		return err
	}
	if len(foundApps) > 1 {
		repositoryNames := make([]string, 0, len(foundApps))
		for _, app := range foundApps {
			repositoryNames = append(repositoryNames, app.Reference().Repository)
		}
		return fmt.Errorf("app %s found in multiple repositories %v", appReferences, repositoryNames)
	}
	r.repositoryApps[appReferences.String()] = foundApps[0]
	return nil
}

func (r *Registry) installFromRepository(appReference *app.Reference) error {
	r.logger.Debugf("Installing app %s from repository %s", appReference, appReference.Repository)
	repository, ok := r.repositories[appReference.Repository]
	if !ok {
		return fmt.Errorf("repository %s not found", appReference.Repository)
	}

	app, err := repository.InstallApp(appReference)
	if err != nil {
		return err
	}

	r.repositoryApps[appReference.String()] = app
	return nil
}

func (r *Registry) hashKey(reference *app.Reference) string {
	return reference.String()
}

func (r *Registry) Get(reference *app.Reference) (app.App, error) {
	app, ok := r.repositoryApps[r.hashKey(reference)]
	if !ok {
		return nil, fmt.Errorf("app %s not found", reference)
	}
	return app, nil
}

func (r *Registry) Stats() string {
	return fmt.Sprintf("Number of apps: %d", len(r.repositoryApps))
}
