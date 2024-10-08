package v0

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/B-S-F/onyx/pkg/configuration"
	v1 "github.com/B-S-F/onyx/pkg/configuration/versions/v1"
	"github.com/B-S-F/onyx/pkg/logger"
	yaml "gopkg.in/yaml.v3"
)

type Header struct {
	Name    string `yaml:"name" json:"name" jsonschema:"required"`
	Version string `yaml:"version" json:"version" jsonschema:"required"`
}

type Component struct {
	Version string `yaml:"version" json:"version" jsonschema:"required"`
}

type Autopilot struct {
	Run string            `yaml:"run" json:"run" jsonschema:"required"`
	Env map[string]string `yaml:"env" json:"env" jsonschema:"optional"`
}

type Check struct {
	Title      string        `yaml:"title" json:"title" jsonschema:"required"`
	Components []string      `yaml:"components" json:"components" jsonschema:"required"`
	Reports    []interface{} `yaml:"reports" json:"reports" jsonschema:"required"`
}

type Requirement struct {
	Title        string           `yaml:"title" json:"title" jsonschema:"required"`
	Text         string           `yaml:"text" json:"text" jsonschema:"required"`
	ManualStatus string           `yaml:"manualStatus" json:"manualStatus" jsonschema:"required"`
	Reason       string           `yaml:"reason" json:"reason" jsonschema:"required"`
	Checks       map[string]Check `yaml:"checks" json:"checks" jsonschema:"required"`
}

type Allocation struct {
	Title        string                 `yaml:"title" json:"title" jsonschema:"required"`
	Text         string                 `yaml:"text" json:"text" jsonschema:"required"`
	Requirements map[string]Requirement `yaml:"requirements" json:"requirements" jsonschema:"required"`
}

type Config struct {
	Header       Header                `yaml:"header" json:"header" jsonschema:"required"`
	Components   map[string]Component  `yaml:"components" json:"components" jsonschema:"required"`
	Globals      map[string]string     `yaml:"globals" json:"globals" jsonschema:"required"`
	Dependencies map[string]string     `yaml:"dependencies" json:"dependencies" jsonschema:"required"`
	Autopilots   map[string]Autopilot  `yaml:"autopilots" json:"autopilots" jsonschema:"required"`
	Reports      map[string]string     `yaml:"reports" json:"reports" jsonschema:"required"`
	Finalize     Autopilot             `yaml:"finalize" json:"finalize" jsonschema:"required"`
	Allocations  map[string]Allocation `yaml:"allocations" json:"allocations" jsonschema:"required"`
}

func New(content []byte) (configuration.Config, error) {
	var c *Config = &Config{}
	err := yaml.Unmarshal(content, c)
	if err != nil {
		return nil, fmt.Errorf("error parsing config file '%s'", err)
	}
	return c, nil
}

func migrateReport(report interface{}, reports map[string]string, checkTitle string) (*v1.Check, error) {
	logger := logger.Get()
	if reportName, ok := report.(string); ok {
		logger.Infof("migrated simple report: %v", reportName)
		return &v1.Check{
			Title: checkTitle,
			Automation: v1.Automation{
				Autopilot: reports[reportName],
				Env:       map[string]string{},
			},
		}, nil
	}
	if reportMap, ok := report.(map[string]interface{}); ok {
		for reportName, reportValue := range reportMap {
			logger.Infof("migrated complex report: %v", reportName)
			if reportValueMap, ok := reportValue.(map[string]interface{}); ok {
				var autopilot string
				if autopilotName, ok := reportValueMap["autopilot"].(string); ok {
					logger.Infof("autopilot name override %s -> %s", reportName, autopilotName)
					autopilot = autopilotName
				} else {
					autopilot = reports[reportName]
				}
				logger.Infof("value: %v", reportValueMap)
				if env, ok := reportValueMap["env"].(map[string]interface{}); ok {
					parsedEnv := make(map[string]string)
					for k, v := range env {
						parsedEnv[k] = fmt.Sprintf("%v", v)
					}
					return &v1.Check{
						Title: checkTitle,
						Automation: v1.Automation{
							Autopilot: autopilot,
							Env:       parsedEnv,
						},
					}, nil
				}
			}
		}
	}
	return nil, fmt.Errorf("report %v could not be migrated", report)
}

func (c *Config) Migrate() ([]byte, error) {
	if len(c.Components) > 1 {
		return nil, errors.New("cannot migrate config with more than one component")
	}
	newConfig := v1.Config{}
	newConfig.Metadata = v1.Metadata{
		Version: "v1",
	}
	newConfig.Header = v1.Header(c.Header)
	newConfig.Env = c.Globals
	newConfig.Autopilots = make(map[string]v1.Autopilot)
	for k, v := range c.Autopilots {

		newConfig.Autopilots[k] = v1.Autopilot{
			Run:    v.Run,
			Env:    v.Env,
			Config: nil,
		}
	}
	newConfig.Finalize = v1.Autopilot{
		Run: c.Finalize.Run,
		Env: c.Finalize.Env,
	}
	chapters := make(map[string]v1.Chapter)
	for allocationKey, allocation := range c.Allocations {
		requirements := make(map[string]v1.Requirement)
		chapter := v1.Chapter{}
		chapter.Title = allocation.Title
		chapter.Text = allocation.Text
		chapter.Requirements = requirements
		chapters[allocationKey] = chapter
		for requirementKey, requirement := range allocation.Requirements {
			checks := make(map[string]v1.Check)
			for checkKey, check := range requirement.Checks {
				newChecks := []v1.Check{}
				for _, report := range check.Reports {
					newCheck, err := migrateReport(report, c.Reports, check.Title)
					if err != nil {
						return nil, err
					}
					newChecks = append(newChecks, *newCheck)
				}
				if len(newChecks) == 1 {
					checks[checkKey] = newChecks[0]
				} else {
					for index, check := range newChecks {
						check.Title = check.Title + "--" + strconv.Itoa(index)
						newCheckKey := checkKey + "--" + strconv.Itoa(index)
						checks[newCheckKey] = check
					}
				}
			}
			if requirement.ManualStatus != "" {
				var status string
				if requirement.ManualStatus == "PENDING" {
					status = "UNANSWERED"
				} else {
					status = requirement.ManualStatus
				}
				check := v1.Check{
					Title: requirement.Title + "_check",
					Manual: v1.Manual{
						Status: status,
						Reason: requirement.Reason,
					},
				}
				requirements[requirementKey] = v1.Requirement{
					Title: requirement.Title,
					Text:  requirement.Text,
					Checks: map[string]v1.Check{
						"1": check,
					},
				}
			} else if len(requirement.Checks) > 0 {
				requirements[requirementKey] = v1.Requirement{
					Title:  requirement.Title,
					Text:   requirement.Text,
					Checks: checks,
				}
			} else {
				check := v1.Check{
					Title: requirement.Title + "_check",
					Manual: v1.Manual{
						Status: "UNANSWERED",
						Reason: "Not answered",
					},
				}
				requirements[requirementKey] = v1.Requirement{
					Title: requirement.Title,
					Text:  requirement.Text,
					Checks: map[string]v1.Check{
						"1": check,
					},
				}
			}
		}
		chapters[allocationKey] = v1.Chapter{
			Title:        allocation.Title,
			Text:         allocation.Text,
			Requirements: requirements,
		}
	}
	newConfig.Chapters = chapters
	return yaml.Marshal(newConfig)
}

func (c *Config) Parse() (*configuration.ExecutionPlan, error) {
	return nil, errors.New("Parse is not implemented for v0")
}
