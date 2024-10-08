package config

import (
	"regexp"

	"github.com/B-S-F/onyx/pkg/logger"
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
					return errors.Wrap(err, "invalid step id "+step.ID)
				}
			}
		}
		// validate depends
		for _, autopilot := range cfg.Autopilots {
			for _, step := range autopilot.Steps {
				for _, depends := range step.Depends {
					if !idMap[depends] {
						return errors.Errorf("missing dependency %s", depends)
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
				for _, check := range req.Checks {
					if check.isAutomation() && check.isManual() {
						return errors.Errorf("checks can't have both manual and automated checks")
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
		return errors.New("ID contains invalid characters. Only alphanumeric characters, dashes, and underscores are allowed.")
	}

	if _, exists := existingIDs[id]; exists {
		return errors.New("ID must be unique. This ID already exists.")
	}

	existingIDs[id] = true

	return nil
}
