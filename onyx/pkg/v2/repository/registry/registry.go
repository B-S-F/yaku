package registry

import (
	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/registry"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/repository/app"
	"github.com/pkg/errors"
)

func Initialize(ep *model.ExecutionPlan, repositories []repository.Repository) (*registry.Registry, error) {
	appReferences := app.AppReferences(ep)
	appRegistry := registry.NewRegistry(repositories)
	for _, appReference := range appReferences {
		err := appRegistry.Install(appReference)
		if err != nil {
			return nil, errors.Wrap(err, "error adding app to registry")
		}
	}
	return appRegistry, nil
}
