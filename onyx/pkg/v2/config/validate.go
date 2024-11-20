// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package config

import (
	"fmt"
	"regexp"

	"github.com/B-S-F/yaku/onyx/pkg/logger"
	"github.com/B-S-F/yaku/onyx/pkg/v2/model"
	"github.com/pkg/errors"
)

func Validate(config interface{}) error {
	switch cfg := (config).(type) {
	case *Config:
		// validate ids
		idMap := make(map[string]bool)
		for _, autopilot := range cfg.Autopilots {
			for _, step := range autopilot.Steps {
				if step.ID == "" {
					continue
				}
				if err := validateID(step.ID, idMap); err != nil {
					return err
				}
			}
		}
		// validate depends
		for _, autopilot := range cfg.Autopilots {
			for _, step := range autopilot.Steps {
				for _, depends := range step.Depends {
					if !idMap[depends] {
						return model.NewUserErr(errors.Errorf("missing dependency %s", depends), "config validation failed")
					}
				}
			}
		}
		// validate repositories
		repositoryNames := make(map[string]bool)
		for _, repo := range cfg.Repositories {
			if repositoryNames[repo.Name] {
				logger.Get().Warnf("repository with name %s already exists", repo.Name)
				continue
			}
			repositoryNames[repo.Name] = true
		}
		// validate checks
		for _, chap := range cfg.Chapters {
			for _, req := range chap.Requirements {
				for checkID, check := range req.Checks {
					if check.isAutomation() && check.isManual() {
						return model.NewUserErr(errors.Errorf("invalid check '%s': checks can't have both manual and automated checks", checkID), "config validation failed")
					}
				}
			}
		}
	}
	return nil
}

// validateID checks if the ID is valid according to the specified rules and if it's unique in the provided map.
func validateID(id string, existingIDs map[string]bool) error {
	isValidIDPattern, err := regexp.Compile(`^[a-zA-Z0-9_-]+$`)
	if err != nil {
		return errors.Wrap(err, "failed to compile regex: %v")
	}

	if !isValidIDPattern.MatchString(id) {
		return model.NewUserErr(fmt.Errorf("invalid step id '%s': ID contains invalid characters. Only alphanumeric characters, dashes, and underscores are allowed.", id), "config validation failed")
	}

	if _, exists := existingIDs[id]; exists {
		return model.NewUserErr(fmt.Errorf("invalid step id '%s': ID must be unique. This ID already exists.", id), "config validation failed")
	}

	existingIDs[id] = true

	return nil
}
