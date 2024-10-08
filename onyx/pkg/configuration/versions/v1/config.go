package v1

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	v2 "github.com/B-S-F/onyx/pkg/v2/config"
	yaml "gopkg.in/yaml.v3"
)

/*
	Some example of a configuration package
*/

// Contains the metadata of the configuration
type Metadata struct {
	// Version of the configuration
	// Example "v1"
	Version string `yaml:"version" json:"version" jsonschema:"required"`
}

// Contains the header to identify the project
type Header struct {
	// Name of the project
	// Example "My Project"
	Name string `yaml:"name" json:"name" jsonschema:"required"`
	// Version of the project
	// Example "0.1.0"
	Version string `yaml:"version" json:"version" jsonschema:"required"`
}

// Contains a autopilot configurations
type Autopilot struct {
	// A list of apps that the autopilot is able to use
	// Example
	// 	- my-app@1.0.0
	// 	- my-other-app@2.0.0
	Apps []string `yaml:"apps,omitempty" json:"apps,omitempty" jsonschema:"optional"`
	// A bash script to execute
	// In order to provide a multiline script, use the "|" symbol
	// Example "echo 'Hello World'"
	// Example Run: |
	// 	echo 'Hello World'
	Run string `yaml:"run" json:"run" jsonschema:"required"`
	// Environment variables to be set before executing the script
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Configuration files needed by the autopilot
	// Example
	// 	- my-config.yaml
	// 	- my-other-config.yaml
	Config []string `yaml:"config,omitempty" json:"config,omitempty" jsonschema:"optional"`
}

// Contains a hard coded answer for a check that cannot be or is still not automated
type Manual struct {
	// Manual status
	// Example "YELLOW"
	Status string `yaml:"status,omitempty" json:"status,omitempty" jsonschema:"required,enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=SKIPPED"`
	// Manual reason
	// Example "This is my reason"
	Reason string `yaml:"reason,omitempty" json:"reason,omitempty" jsonschema:"required"`
}

// Defined the automation of executing a check
type Automation struct {
	// Reference to the autopilot defined in the autopilots section
	// Example "my-autopilot"
	Autopilot string `yaml:"autopilot" json:"autopilot" jsonschema:"required"`
	// Environment variables to be set before executing the script
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Configuration files needed by the autopilot
	// Example
	// 	- my-config.yaml
	// 	- my-other-config.yaml
	Config []string `yaml:"config,omitempty" json:"config,omitempty" jsonschema:"optional"`
}

// Contains configuration to execute a check either manually or automated
type Check struct {
	// Title of the check
	// Example "My Check"
	Title string `yaml:"title" json:"title" jsonschema:"required"`
	// Manual answer to provide a non-automated result for a check
	// Example
	// 	manual:
	// 	  status: YELLOW
	// 	  reason: This is my reason
	Manual Manual `yaml:"manual,omitempty" json:"manual,omitempty" jsonschema:"anyof_required=manual"`
	// Automation  of the check executed by an autopilot which provides a result
	// Example
	// automation:
	//   autopilot: "my-autopilot"
	//   env:
	//     FOO: bar
	//   config
	//     - my-config.yaml
	Automation Automation `yaml:"automation,omitempty" json:"automation,omitempty" jsonschema:"anyof_required=automation"`
}

// Contains a configuration to answer a requirement
type Requirement struct {
	// Title of the requirement
	// Example "My Requirement"
	Title string `yaml:"title" json:"title" jsonschema:"required"`
	// Text of the requirement
	// In order to provide a multiline text, use the ">" symbol
	// Example "This is my requirement"
	// Example Text: >
	// 	This is my requirement
	Text string `yaml:"text,omitempty" json:"text,omitempty" jsonschema:"optional"`
	// Checks to answer the requirement
	// Example
	// 	my-check:
	// 	  - name: my-reused-autopilot
	// 	    autopilot: my-autopilot
	// 	    env:
	// 	      FOO: bar
	// 	      BAZ: qux
	Checks map[string]Check `yaml:"checks,omitempty" json:"checks,omitempty" jsonschema:"required"`
}

// Contains a configuration to answer a chapter
type Chapter struct {
	// Title of the chapter
	// Example "My Chapter"
	Title string `yaml:"title" json:"title" jsonschema:"title=required"`
	// Text of the chapter
	// In order to provide a multiline text, use the ">" symbol
	// Example "This is my chapter"
	// Example Text: >
	// 	This is my chapter
	Text string `yaml:"text,omitempty" json:"text,omitempty" jsonschema:"optional"`
	// Requirements to answer the chapter
	// Example^
	// 	my-requirement:
	// 	  title: My Requirement
	// 	  text: This is my requirement
	// 	  checks: ...
	Requirements map[string]Requirement `yaml:"requirements" json:"requirements" jsonschema:"required"`
}

type Default struct {
	// Default vars
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Vars map[string]string `yaml:"vars,omitempty" json:"vars,omitempty" jsonschema:"optional"`
}

type AppRepository struct {
	Name string `yaml:"name" json:"name" jsonschema:"required"`
	// Type of the repository
	// Example "curl"
	Type string `yaml:"type" json:"type" jsonschema:"required"`
	// Configuration of the repository
	// Example
	// 	url: "https://my-file-server.com/my-file.yaml"
	// 	auth:
	//		type: "basic"
	// 		username: "my-username"
	//		password: "my-password"
	Config map[string]interface{} `yaml:"configuration" json:"configuration" jsonschema:"required"`
}

// Contains the configuration of the project
type Config struct {
	// Metadata of the configuration
	Metadata Metadata `yaml:"metadata" json:"metadata" jsonschema:"required"`
	// Header of the configuration
	Header Header `yaml:"header" json:"header" jsonschema:"required"`
	// Default parameters
	Default Default `yaml:"default,omitempty" json:"default,omitempty" jsonschema:"optional"`
	// Global environment variables to be available in all autopilots
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Extra dependencies to be installed
	Repositories []AppRepository `yaml:"repositories,omitempty" json:"repositories,omitempty" jsonschema:"optional"`
	// Autopilot configurations
	Autopilots map[string]Autopilot `yaml:"autopilots,omitempty" json:"autopilots" jsonschema:"optional"`
	// Finalize configuration
	Finalize Autopilot `yaml:"finalize,omitempty" json:"finalize,omitempty" jsonschema:"optional"`
	// Chapters of the project
	Chapters map[string]Chapter `yaml:"chapters" json:"chapters" jsonschema:"required"`
}

func New(content []byte) (configuration.Config, error) {
	var c Config
	err := yaml.Unmarshal(content, &c)
	return &c, err
}

func (c *Config) Migrate() ([]byte, error) {
	logger := logger.Get()
	var newConfig v2.Config
	newConfig.Metadata = v2.Metadata{
		Version: "v2",
	}
	newConfig.Header = v2.Header{
		Name:    c.Header.Name,
		Version: c.Header.Version,
	}
	newConfig.Default = v2.Default{
		Vars: c.Default.Vars,
	}
	newConfig.Env = c.Env
	for _, repo := range c.Repositories {
		newConfig.Repositories = append(newConfig.Repositories, v2.Repository{
			Name:   repo.Name,
			Type:   repo.Type,
			Config: repo.Config,
		})
	}
	newConfig.Autopilots = make(map[string]v2.Autopilot)
	for name, autopilot := range c.Autopilots {
		newConfig.Autopilots[name] = v2.Autopilot{
			Apps: autopilot.Apps,
			Evaluate: v2.Evaluate{
				Env:    autopilot.Env,
				Config: autopilot.Config,
				Run:    autopilot.Run,
			},
		}
	}

	if c.Finalize.Run != "" {
		newConfig.Finalize = &v2.Finalize{
			Env:    c.Finalize.Env,
			Config: c.Finalize.Config,
			Run:    c.Finalize.Run,
		}
	}

	newConfig.Chapters = make(map[string]v2.Chapter)
	for chapKey, v1chap := range c.Chapters {
		chapter := v2.Chapter{
			Title:        v1chap.Title,
			Text:         v1chap.Text,
			Requirements: make(map[string]v2.Requirement),
		}
		for reqKey, v1req := range v1chap.Requirements {
			requirement := v2.Requirement{
				Title:  v1req.Title,
				Text:   v1req.Text,
				Checks: make(map[string]v2.Check),
			}
			for checkKey, v1check := range v1req.Checks {
				check := v2.Check{
					Title: v1check.Title,
				}
				if v1check.Manual != (Manual{}) {
					check.Manual = &v2.Manual{
						Status: v1check.Manual.Status,
						Reason: v1check.Manual.Reason,
					}
				}
				if v1check.Automation.Autopilot != "" {
					check.Automation = &v2.Automation{
						Autopilot: v1check.Automation.Autopilot,
						Env:       v1check.Automation.Env,
					}
					if len(v1check.Automation.Config) > 0 {
						if autopilot, ok := newConfig.Autopilots[v1check.Automation.Autopilot]; ok {
							if autopilot.Evaluate.Config == nil {
								autopilot.Evaluate.Config = make([]string, 0)
							}
							// if config string is not already in the list, add it
							for _, config := range v1check.Automation.Config {
								if !contains(autopilot.Evaluate.Config, config) {
									autopilot.Evaluate.Config = append(autopilot.Evaluate.Config, config)
								} else {
									logger.Warnf("config %s already exists in autopilot %s, ignoring it", config, v1check.Automation.Autopilot)
								}
							}
							newConfig.Autopilots[v1check.Automation.Autopilot] = autopilot
						} else {
							logger.Warnf("autopilot %s not found", v1check.Automation.Autopilot)
						}
					}
				}
				requirement.Checks[checkKey] = check
			}
			chapter.Requirements[reqKey] = requirement
		}
		newConfig.Chapters[chapKey] = chapter
	}

	return yaml.Marshal(newConfig)
}

func (c *Config) Parse() (*configuration.ExecutionPlan, error) {
	// TODO: error handling for missing config values
	logger := logger.Get()
	var plan = configuration.ExecutionPlan{}
	plan.Env = c.Env
	plan.DefaultVars = c.Default.Vars
	plan.Repositories = []configuration.Repository{}
	repositoryNames := make(map[string]bool)
	for _, repo := range c.Repositories {
		if _, ok := repositoryNames[repo.Name]; ok {
			logger.Warnf("repository with name %s already exists", repo.Name)
			continue
		}
		repositoryNames[repo.Name] = true
		plan.Repositories = append(plan.Repositories, configuration.Repository{
			Name:   repo.Name,
			Type:   repo.Type,
			Config: repo.Config,
		})
	}
	for chapKey, v1chap := range c.Chapters {
		chapter := configuration.Chapter{
			Id:    chapKey,
			Title: v1chap.Title,
			Text:  v1chap.Text,
		}
		for reqKey, v1req := range v1chap.Requirements {
			requirement := configuration.Requirement{
				Id:    reqKey,
				Title: v1req.Title,
				Text:  v1req.Text,
			}
			for checkKey, v1check := range v1req.Checks {
				var validationErr string
				check := configuration.Check{
					Id:    checkKey,
					Title: v1check.Title,
				}
				item := configuration.Item{
					Chapter:     chapter,
					Requirement: requirement,
					Check:       check,
				}
				if v1check.Manual != (Manual{}) {
					item.Manual = configuration.Manual{
						Status: v1check.Manual.Status,
						Reason: v1check.Manual.Reason,
					}
				}
				if v1check.Automation.Autopilot != "" {
					autopilot, ok := c.Autopilots[v1check.Automation.Autopilot]
					if !ok {
						validationErr = fmt.Sprintf("autopilot %s not found", v1check.Automation.Autopilot)
						logger.Warn(validationErr)
					}
					config := make(map[string]string)
					configSlice := append(autopilot.Config, v1check.Automation.Config...)
					for _, c := range configSlice {
						config[c] = ""
					}
					item.Env = v1check.Automation.Env
					item.Config = config
					item.Autopilot = configuration.Autopilot{
						Name: v1check.Automation.Autopilot,
						Run:  autopilot.Run,
						Env:  autopilot.Env,
					}
					for _, app := range autopilot.Apps {
						appIdentifier, err := configuration.NewAppReference(app)
						if err != nil {
							if validationErr == "" {
								validationErr = fmt.Sprintf("app identifier %s is invalid: %v", app, err)
							} else {
								validationErr = fmt.Sprintf("%s\napp identifier %s is invalid: %v", validationErr, app, err)
							}
							logger.Warnf("app identifier %s is invalid: %v", app, err)
							continue
						}
						if appIdentifier.Repository != "" {
							if _, ok := repositoryNames[appIdentifier.Repository]; !ok {
								logger.Warnf("repository %s referenced in app %s not found", appIdentifier.Repository, app)
								if validationErr == "" {
									validationErr = fmt.Sprintf("repository %s referenced in app %s not found", appIdentifier.Repository, app)
								} else {
									validationErr = fmt.Sprintf("%s\nrepository %s referenced in app %s not found", validationErr, appIdentifier.Repository, app)
								}
								continue
							}
						}
						item.AppReferences = append(item.AppReferences, appIdentifier)
					}
				}
				item.ValidationErr = validationErr
				plan.Items = append(plan.Items, item)
			}
		}
	}

	if c.Finalize.Run != "" {
		plan.Finalize = configuration.Item{
			Autopilot: configuration.Autopilot{
				Name: "finalizer",
				Run:  c.Finalize.Run,
				Env:  c.Finalize.Env,
			},
		}
	}
	if c.Finalize.Config != nil {
		plan.Finalize.Config = make(map[string]string)
		for _, c := range c.Finalize.Config {
			plan.Finalize.Config[c] = ""
		}
	}
	plan.Metadata = configuration.Metadata{
		Version: c.Metadata.Version,
	}
	plan.Header = configuration.Header{
		Name:    c.Header.Name,
		Version: c.Header.Version,
	}
	return &plan, nil
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
