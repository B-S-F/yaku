// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package registry

import (
	"github.com/B-S-F/yaku/onyx/pkg/repository"
	"github.com/B-S-F/yaku/onyx/pkg/repository/registry"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/B-S-F/yaku/onyx/pkg/v2/repository/app"
)

func Initialize(ep *model.ExecutionPlan, repositories []repository.Repository) (*registry.Registry, error) {
	appReferences := app.AppReferences(ep)
	appRegistry := registry.NewRegistry(repositories)
	for _, appReference := range appReferences {
		err := appRegistry.Install(appReference)
		if err != nil {
			return nil, err
		}
	}
	return appRegistry, nil
}
