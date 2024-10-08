package v1

import "github.com/B-S-F/onyx/pkg/result/common"

const (
	FAILED  = "FAILED"
	SKIPPED = "SKIPPED"
	NA      = "NA"
)

// Contains the metadata of the result
type Metadata struct {
	// Version of the result
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
	// Current date
	// Example "2023-08-03 16:16"
	Date string `yaml:"date" json:"date" jsonschema:"required"`
	// Version of the onyx cli tool
	// Example "0.1.0"
	ToolVersion string `yaml:"toolVersion" json:"toolVersion" jsonschema:"required"`
}

// Contains information about the execution of an autopilot
type ExecutionInformation struct {
	// Logs from the execution of the autopilot
	// Example
	// 	- "Hello World"
	// 	- "This is my log"
	Logs []string `yaml:"logs,omitempty" json:"logs" jsonschema:"optional"`
	// Error logs from the execution of the autopilot
	// Example
	// 	- "Hello Error"
	// 	- "This is my error log"
	ErrorLogs []string `yaml:"errorLogs,omitempty" json:"errorLogs" jsonschema:"optional"`
	// Path where the evidence of the autopilot is stored
	EvidencePath string `yaml:"evidencePath" json:"evidencePath" jsonschema:"required"`
	// Exit code of the autopilot
	ExitCode int `yaml:"exitCode" json:"exitCode" jsonschema:"required"`
}

// Contains one of potentially many results reported by an autopilot
type AutopilotResult struct {
	// Criterion that was evaluated by the autopilot
	// Example "My Criterion"
	Criterion common.MultilineString `yaml:"criterion" json:"criterion" jsonschema:"required"`
	// Flag whether the criterion was fulfilled or not, indicating if an issue will be reported to the user or not
	// Example true
	Fulfilled bool `yaml:"fulfilled" json:"fulfilled" jsonschema:"required"`
	// Human readable justification of why the criterion was evaluated to be fulfilled or not
	// Example "This is my justification"
	Justification common.MultilineString `yaml:"justification" json:"justification" jsonschema:"required"`
	// Metadata of the criterion that was evaluated
	// Example
	// 	- "foo": "bar"
	// 	- "baz": "qux"
	Metadata common.StringMap `yaml:"metadata,omitempty" json:"metadata" jsonschema:"optional"`
}

// Contains the results of a check
type CheckResult struct {
	// Name of the autopilot
	// Example "my-autopilot"
	Autopilot string `yaml:"autopilot,omitempty" json:"autopilot" jsonschema:"optional"`
	// Status of the autopilot
	// Example "GREEN"
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=FAILED,enum=ERROR"`
	// Reason associated with the status
	// Example "This is my reason"
	Reason string `yaml:"reason" json:"reason" jsonschema:"required"`
	// Results of the autopilot
	Results []AutopilotResult `yaml:"results,omitempty" json:"results" jsonschema:"optional"`
	// Outputs of the autopilot
	Outputs map[string]string `yaml:"outputs,omitempty" json:"outputs" jsonschema:"optional"`
	// Execution information of the autopilot
	Execution ExecutionInformation `yaml:"execution,omitempty" json:"execution" jsonschema:"optional"`
}

// Contains information about a check
type Check struct {
	// Title of the check
	// Example "My Check"
	Title string `yaml:"title,omitempty" json:"title" jsonschema:"required"`
	// Status of the check (is derived from the autopilot status)
	// Example "GREEN"
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=FAILED,enum=ERROR"`
	// Type of the check
	// Example "autopilot"
	Type string `yaml:"type" json:"type" jsonschema:"required,enum=autopilot,enum=manual"`
	// Evaluation of the check containing the result
	Evaluation CheckResult `yaml:"evaluation" json:"evaluation" jsonschema:"required"`
}

// Contains information about a requirement
type Requirement struct {
	// Title of the requirement
	// Example "My Requirement"
	Title string `yaml:"title,omitempty" json:"title" jsonschema:"required"`
	// Text of the requirement
	// Example "This is my requirement"
	Text string `yaml:"text,omitempty" json:"text" jsonschema:"optional"`
	// Status of the requirement (is composed of the status of the checks)
	// Example "GREEN"
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=FAILED,enum=ERROR"`
	// Checks to answer the requirement
	Checks map[string]*Check `yaml:"checks,omitempty" json:"checks" jsonschema:"required"`
}

// Contains information about a chapter
type Chapter struct {
	// Title of the chapter
	// Example "My Chapter"
	Title string `yaml:"title,omitempty" json:"title" jsonschema:"required"`
	// Text of the chapter
	// Example "This is my chapter"
	Text string `yaml:"text,omitempty" json:"text" jsonschema:"optional"`
	// Status of the chapter (is composed of the status of the requirements)
	// Example "GREEN"
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=FAILED,enum=ERROR"`
	// Requirements to answer the chapter
	Requirements map[string]*Requirement `yaml:"requirements" json:"requirements" jsonschema:"required"`
}

// Contains information about the finalization
type Finalize struct {
	// Execution information of the finalize step
	Execution ExecutionInformation `yaml:"execution" json:"execution" jsonschema:"required"`
}

// Contains statistics about the result
type Statistics struct {
	// Number of checks
	CountChecks uint `yaml:"counted-checks" json:"counted-checks" jsonschema:"required"`
	// Number of automated checks
	CountAutomatedChecks uint `yaml:"counted-automated-checks" json:"counted-automated-checks" jsonschema:"required"`
	// Number of manual checks (excluding unanswered and skipped)
	CountManualChecks uint `yaml:"counted-manual-check" json:"counted-manual-check" jsonschema:"required"`
	// Number of unanswered checks
	CountUnansweredChecks uint `yaml:"counted-unanswered-checks" json:"counted-unanswered-checks" jsonschema:"required"`
	// Number of skipped checks
	CountSkippedChecks uint `yaml:"counted-skipped-checks" json:"counted-skipped-checks" jsonschema:"required"`
	// Percentage of automated checks
	PercentageAutomated float64 `yaml:"degree-of-automation" json:"degree-of-automation" jsonschema:"required"`
	// Percentage of answered checks
	PercentageDone float64 `yaml:"degree-of-completion" json:"degree-of-completion" jsonschema:"required"`
}

// Contains the result of a run
type Result struct {
	// Metadata of the result
	Metadata Metadata `yaml:"metadata" json:"metadata" jsonschema:"required"`
	// Header of the result
	Header Header `yaml:"header" json:"header" jsonschema:"required"`
	// Overall status of the result (is composed of the status of the chapters)
	OverallStatus string `yaml:"overallStatus" json:"overallStatus" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=FAILED,enum=ERROR"`
	// Statistics of the result
	Statistics Statistics `yaml:"statistics" json:"statistics" jsonschema:"required"`
	// Chapters containing requirements and checks
	Chapters map[string]*Chapter `yaml:"chapters" json:"chapters" jsonschema:"required"`
	// Finalize step
	Finalize *Finalize `yaml:"finalize,omitempty" json:"finalize" jsonschema:"optional"`
}
