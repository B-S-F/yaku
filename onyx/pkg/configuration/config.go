package configuration

import (
	"fmt"
	"regexp"
	"strings"
)

type Config interface {
	// Migrates the configuration file to the next version
	Migrate() ([]byte, error)
	// Parse the config to the internal data structure
	Parse() (*ExecutionPlan, error)
}

type Metadata struct {
	Version string `yaml:"version" json:"version"`
}

type Header struct {
	Name    string `yaml:"name" json:"name"`
	Version string `yaml:"version" json:"version"`
}

type ConfigData struct {
	Metadata Metadata `yaml:"metadata" json:"metadata"`
	Header   Header   `yaml:"header" json:"header"`
}

type Chapter struct {
	Id    string
	Title string
	Text  string
}

type Requirement struct {
	Id    string
	Title string
	Text  string
}

type Manual struct {
	Status string
	Reason string
}

type Check struct {
	Id    string
	Title string
}

type Autopilot struct {
	Name string
	Run  string
	Env  map[string]string
}

type AppReference struct {
	Repository string
	Name       string
	Version    string
}

func NewAppReference(reference string) (*AppReference, error) {
	appReference := AppReference{}
	parts := strings.Split(reference, "::")
	if len(parts) == 2 {
		appReference.Repository = parts[0]
		reference = parts[1]
	}
	parts = strings.Split(reference, "@")
	if len(parts) == 2 {
		appReference.Name = parts[0]
		appReference.Version = parts[1]
	}
	if appReference.Name == "" {
		appReference.Name = reference
	}
	err := appReference.verify()
	if err != nil {
		return nil, fmt.Errorf("error creating app reference: %w", err)
	}
	return &appReference, nil
}

func (a *AppReference) verify() error {
	regexReservedCharacters := regexp.MustCompile(`[;/?:@=&]`)
	regexUnsafeCharacters := regexp.MustCompile(`[<>#%|\\^~\[\]` + "`" + `"\s]`)
	if a.Name == "" {
		return fmt.Errorf("app name must be set in app reference")
	}
	if invalid := regexReservedCharacters.FindAllString(a.Name, -1); invalid != nil {
		return fmt.Errorf("app name contains reserved characters %v", invalid)
	}
	if invalid := regexUnsafeCharacters.FindAllString(a.Name, -1); invalid != nil {
		return fmt.Errorf("app name contains unsafe characters %v", invalid)
	}
	if a.Version == "" {
		return fmt.Errorf("app version must be set in app reference")
	}
	if invalid := regexReservedCharacters.FindAllString(a.Version, -1); invalid != nil {
		return fmt.Errorf("app version contains reserved characters %v", invalid)
	}
	if invalid := regexUnsafeCharacters.FindAllString(a.Version, -1); invalid != nil {
		return fmt.Errorf("app version contains unsafe characters %v", invalid)
	}
	return nil
}

type Repository struct {
	Name   string
	Type   string
	Config map[string]interface{}
}

type Item struct {
	AppReferences []*AppReference
	Chapter
	Requirement
	Check
	Env     map[string]string
	AppPath string
	Config  map[string]string
	Autopilot
	Manual
	ValidationErr string
}

func (i *Item) String() string {
	var answerString string
	if i.Manual != (Manual{}) {
		answerString = "Manual: " + i.Manual.Status
	} else {
		answerString = "Autopilot: " + i.Autopilot.Name
	}
	return fmt.Sprintf("Chapter: %s, Requirement: %s, Check: %s, %s", i.Chapter.Id, i.Requirement.Id, i.Check.Id, answerString)
}

type ExecutionPlan struct {
	Metadata     Metadata
	Header       Header
	DefaultVars  map[string]string
	Env          map[string]string
	Items        []Item
	Finalize     Item
	Repositories []Repository
}

func (e *ExecutionPlan) String() string {
	res := ""
	for _, item := range e.Items {
		res += item.String() + "\n"
	}
	return res
}
