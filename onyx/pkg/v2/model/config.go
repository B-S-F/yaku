package model

import (
	conf "github.com/B-S-F/onyx/pkg/configuration"
)

type ExecutionPlan struct {
	Metadata        conf.Metadata
	Header          conf.Header
	DefaultVars     map[string]string
	Env             map[string]string
	AutopilotChecks []AutopilotCheck
	ManualChecks    []ManualCheck
	Repositories    []conf.Repository
	Finalize        *Finalize
}

type Item struct {
	Chapter     conf.Chapter
	Requirement conf.Requirement
	Check       conf.Check
}

type Autopilot struct {
	Env      map[string]string
	Evaluate Evaluate
	Name     string
	Steps    [][]Step
}

type Step struct {
	Title   string
	ID      string
	Env     map[string]string
	Configs map[string]string
	Run     string
	Depends []string
}

type Evaluate struct {
	Env     map[string]string
	Configs map[string]string
	Run     string
}
