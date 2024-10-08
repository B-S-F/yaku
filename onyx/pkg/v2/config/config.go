package config

import (
	"fmt"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/logger"
	model "github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

type Config struct {
	// Metadata of the configuration
	Metadata Metadata `yaml:"metadata" json:"metadata" jsonschema:"required"`
	// Header of the configuration
	Header Header `yaml:"header" json:"header" jsonschema:"required"`
	// Default parameters
	Default Default `yaml:"default,omitempty" json:"default,omitempty" jsonschema:"optional"`
	// Global environment variables to be available in all autopilots
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Repositories to fetch external apps from
	Repositories []Repository `yaml:"repositories" json:"repositories" jsonschema:"optional"`
	// Autopilot configurations
	Autopilots map[string]Autopilot `yaml:"autopilots" json:"autopilots" jsonschema:"optional"`
	// Finalize configuration
	Finalize *Finalize `yaml:"finalize,omitempty" json:"finalize,omitempty" jsonschema:"optional"`
	// Chapters of the project
	Chapters map[string]Chapter `yaml:"chapters" json:"chapters" jsonschema:"required"`
}

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

type Default struct {
	// Default vars
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Vars map[string]string `yaml:"vars" json:"vars" jsonschema:"optional"`
}

type Repository struct {
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

type Autopilot struct {
	// A list of apps that the autopilot is able to use
	// Example
	// 	- my-app@1.0.0
	// 	- my-other-app@2.0.0
	Apps []string `yaml:"apps,omitempty" json:"apps,omitempty" jsonschema:"optional"`
	// Environment variables to be set before executing the script
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Steps to be executed by the autopilot
	// Example
	// 	- title: "step-1"
	//    id: fetch1
	//    run: sharepoint-fetcher --config-file=..._1.yaml --output-dir=...
	Steps []Step `yaml:"steps,omitempty" json:"steps,omitempty" jsonschema:"optional"`
	// Evaluate the output of the autopilot
	// evaluate:
	// env:
	// 	RESULT_FILE_1: ...
	// 	RESULT_FILE_2: ...
	// run: |
	//   # do evaluation of SharePoint metadata here
	//   # do evaluation of PDF signature data here
	Evaluate Evaluate `yaml:"evaluate" json:"evaluate" jsonschema:"required"`
}

type Step struct {
	// Title of the step
	// Example "Fetch SharePoint data"
	Title string `yaml:"title,omitempty" json:"title,omitempty" jsonschema:"optional"`
	// ID of the step
	// Example "fetch1"
	ID string `yaml:"id,omitempty" json:"id,omitempty" jsonschema:"optional"`
	// Depends on other steps
	// Example
	// 	- fetch2
	// 	- fetch3
	Depends []string `yaml:"depends,omitempty" json:"depends,omitempty" jsonschema:"optional"`
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
	// Action to be executed
	// Example "sharepoint-fetcher --config-file=..._1.yaml --output-dir=..."
	Run string `yaml:"run" json:"run" jsonschema:"required"`
}

type Evaluate struct {
	// Environment variables to be set before executing the script
	// Example
	// 	RESULT_FILE_1: ...
	// 	RESULT_FILE_2: ...
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Configuration files needed by the evaluator
	// Example
	// 	- my-config.yaml
	// 	- my-other-config.yaml
	Config []string `yaml:"config,omitempty" json:"config,omitempty" jsonschema:"optional"`
	// Action to be executed
	// Example
	// 	# do evaluation of SharePoint metadata here
	// 	# do evaluation of PDF signature data here
	Run string `yaml:"run" json:"run" jsonschema:"required"`
}

type Finalize struct {
	// Environment variables to be set before executing the script
	// Example
	// 	RESULT_FILE_1: ...
	// 	RESULT_FILE_2: ...
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Configuration files needed by the finalizer
	// Example
	// 	- my-config.yaml
	// 	- my-other-config.yaml
	Config []string `yaml:"config,omitempty" json:"config,omitempty" jsonschema:"optional"`
	// Action to be executed
	// Example
	// 	# do upload of SharePoint metadata here
	// 	# do upload of PDF data here
	Run string `yaml:"run" json:"run" jsonschema:"required"`
}

// Contains a configuration to answer a chapter
type Chapter struct {
	// Requirements to answer the chapter
	// Example^
	// 	my-requirement:
	// 	  title: My Requirement
	// 	  text: This is my requirement
	// 	  checks: ...
	Requirements map[string]Requirement `yaml:"requirements" json:"requirements" jsonschema:"required"`
	// Title of the chapter
	// Example "My Chapter"
	Title string `yaml:"title" json:"title" jsonschema:"title=required"`
	// Text of the chapter
	// In order to provide a multiline text, use the ">" symbol
	// Example "This is my chapter"
	// Example Text: >
	// 	This is my chapter
	Text string `yaml:"text" json:"text" jsonschema:"optional"`
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
	Checks map[string]Check `yaml:"checks" json:"checks" jsonschema:"required"`
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
	Manual *Manual `yaml:"manual,omitempty" json:"manual,omitempty" jsonschema:"anyof_required=manual"`
	// Automation  of the check executed by an autopilot which provides a result
	// Example
	// automation:
	//   autopilot: "my-autopilot"
	//   env:
	//     FOO: bar
	Automation *Automation `yaml:"automation,omitempty" json:"automation,omitempty" jsonschema:"anyof_required=automation"`
}

// Contains a hard coded answer for a check that cannot be or is still not automated
type Manual struct {
	// Manual status
	// Example "YELLOW"
	Status string `yaml:"status" json:"status" jsonschema:"required,enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED"`
	// Manual reason
	// Example "This is my reason"
	Reason string `yaml:"reason" json:"reason" jsonschema:"required"`
}

// Defined the automation of executing a check
type Automation struct {
	// Environment variables to be set before executing the script
	// Example
	// 	FOO: bar
	// 	BAZ: qux
	Env map[string]string `yaml:"env,omitempty" json:"env,omitempty" jsonschema:"optional"`
	// Reference to the autopilot defined in the autopilots section
	// Example "my-autopilot"
	Autopilot string `yaml:"autopilot" json:"autopilot" jsonschema:"required"`
}

func New(content []byte) (interface{}, error) {
	var c Config
	err := yaml.Unmarshal(content, &c)
	return &c, err
}

func (c *Config) Migrate() ([]byte, error) {
	return nil, fmt.Errorf("there is no new version to migrate to")
}

func (c *Config) CreateExecutionPlan() (*model.ExecutionPlan, error) {
	if c == nil {
		return nil, errors.New("provided config is nil")
	}

	logger := logger.Get()

	ep := model.ExecutionPlan{}

	ep.Metadata = configuration.Metadata{
		Version: c.Metadata.Version,
	}

	ep.Header = configuration.Header{
		Name:    c.Header.Name,
		Version: c.Header.Version,
	}

	var err error
	ep.DefaultVars, err = deepCopyMap(c.Default.Vars)
	if err != nil {
		return nil, errors.Wrap(err, "failed to deep copy 'Vars'")
	}

	ep.Env, err = deepCopyMap(c.Env)
	if err != nil {
		return nil, errors.Wrap(err, "failed to deep copy 'Env'")
	}

	repositoryNames := make(map[string]bool)
	if len(c.Repositories) > 0 {
		ep.Repositories = make([]configuration.Repository, 0, len(c.Repositories))
		for _, repo := range c.Repositories {
			if repositoryNames[repo.Name] {
				continue
			}
			repositoryNames[repo.Name] = true

			rep := configuration.Repository{
				Name: repo.Name,
				Type: repo.Type,
			}

			rep.Config, err = deepCopyMap(repo.Config)
			if err != nil {
				return nil, errors.Wrap(err, "failed to deep copy 'repository.Config'")
			}

			ep.Repositories = append(ep.Repositories, rep)
		}
	}

	for chapIndex, chapter := range c.Chapters {
		for reqIndex, requirement := range chapter.Requirements {
			for checkIndex, check := range requirement.Checks {

				if check.isManual() {
					ep.ManualChecks = append(ep.ManualChecks, createManualCheck(chapIndex, chapter, reqIndex, requirement, checkIndex, check))
					continue
				}

				if check.isAutomation() {
					autopilotItem, err := createAutopilotCheck(logger, chapIndex, chapter, reqIndex, requirement, checkIndex, check, c.Autopilots, repositoryNames)
					if err != nil {
						return nil, errors.Wrap(err, "failed to create autopilotCheck")
					}

					ep.AutopilotChecks = append(ep.AutopilotChecks, autopilotItem)
					continue
				}
			}
		}
	}

	if c.hasFinalize() {
		finalize := &model.Finalize{
			Run: c.Finalize.Run,
		}

		finalize.Env, err = deepCopyMap(c.Finalize.Env)
		if err != nil {
			return nil, errors.Wrap(err, "failed to deep copy 'finalize.Env'")
		}

		if len(c.Finalize.Config) > 0 {
			finalize.Configs = make(map[string]string)
			for _, cfg := range c.Finalize.Config {
				finalize.Configs[cfg] = ""
			}
		}

		ep.Finalize = finalize
	}

	return &ep, nil
}

func (c *Check) isManual() bool {
	return c.Manual != nil
}

func (c *Check) isAutomation() bool {
	return c.Automation != nil
}

func (c *Config) hasFinalize() bool {
	return c.Finalize != nil
}
