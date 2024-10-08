package model

import (
	conf "github.com/B-S-F/onyx/pkg/configuration"
)

type AutopilotCheck struct {
	Item
	Autopilot      Autopilot
	CheckEnv       map[string]string
	AppReferences  []*conf.AppReference
	ValidationErrs []error
	AppPath        string
}

type StepResult struct {
	ID         string
	OutputDir  string
	ResultFile string
	Logs       []LogEntry
	ExitCode   int
	InputDirs  []string
}
type EvaluateResult struct {
	Logs     []LogEntry
	ExitCode int
	Status   string
	Reason   string
	Results  []Result
}

type Result struct {
	Criterion     string
	Fulfilled     bool
	Justification string
	Metadata      map[string]string
}

type AutopilotResult struct {
	StepResults    []StepResult
	EvaluateResult EvaluateResult
	Name           string
}

type LogEntry struct {
	Source string                 `json:"source,omitempty"`
	Json   map[string]interface{} `json:"json,omitempty"`
	Text   string                 `json:"text,omitempty"`
}
