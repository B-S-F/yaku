package app

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/B-S-F/onyx/pkg/repository/registry"
	"github.com/B-S-F/onyx/pkg/tempdir"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
)

var APP_DIRECTORY = tempdir.GetPath("apps")

func Initialize(ep *model.ExecutionPlan, appRegistry *registry.Registry) error {
	for i := range ep.AutopilotChecks {
		autopilotItem := &ep.AutopilotChecks[i]
		for _, configAppReference := range autopilotItem.AppReferences {
			appReference := &app.Reference{
				Repository: configAppReference.Repository,
				Name:       configAppReference.Name,
				Version:    configAppReference.Version,
			}
			app, err := appRegistry.Get(appReference)
			if err != nil {
				return errors.Wrap(err, "error getting app")
			}

			appExecutablePath := app.ExecutablePath()
			checkReference := fmt.Sprintf("%s_%s_%s", autopilotItem.Chapter.Id, autopilotItem.Requirement.Id, autopilotItem.Check.Id)
			checkAppDirectory := filepath.Join(APP_DIRECTORY, checkReference)
			err = os.MkdirAll(checkAppDirectory, 0755)
			if err != nil {
				return errors.Wrapf(err, "error creating directory for app %s for check %s", app.Reference(), checkReference)
			}
			logger.Get().Infof("configured app %s with checksum %s for check %s", app.Reference(), app.Checksum(), checkReference)

			symlinks := app.PossibleReferences()
			err = helper.CreateSymlinks(appExecutablePath, checkAppDirectory, symlinks)
			if err != nil {
				return errors.Wrap(err, "error creating symlinks")
			}
			autopilotItem.AppPath = checkAppDirectory
		}
	}
	return nil
}

func AppReferences(ep *model.ExecutionPlan) []*app.Reference {
	var appReferences []*app.Reference
	for _, autpilotCheck := range ep.AutopilotChecks {
		for _, itemAppReference := range autpilotCheck.AppReferences {
			appReferences = append(appReferences, &app.Reference{
				Repository: itemAppReference.Repository,
				Name:       itemAppReference.Name,
				Version:    itemAppReference.Version,
			})
		}
	}
	return appReferences
}
