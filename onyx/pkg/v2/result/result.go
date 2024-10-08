package result

import "github.com/B-S-F/onyx/pkg/result/common"

// Contains the result of a run
type Result struct {
	// Metadata of the result
	Metadata Metadata `yaml:"metadata" json:"metadata" jsonschema:"required"`
	// Header of the result
	Header Header `yaml:"header" json:"header" jsonschema:"required"`
	// Overall status of the result (is composed of the status of the chapters)
	OverallStatus string `yaml:"overallStatus" json:"overallStatus" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=ERROR"`
	// Statistics of the result
	Statistics Statistics `yaml:"statistics" json:"statistics" jsonschema:"required"`
	// Chapters containing requirements and checks
	Chapters map[string]*Chapter `yaml:"chapters" json:"chapters" jsonschema:"required"`
	// Finalize step
	Finalize *Finalize `yaml:"finalize,omitempty" json:"finalize" jsonschema:"optional"`
}

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
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=ERROR"`
	// Requirements to answer the chapter
	Requirements map[string]*Requirement `yaml:"requirements" json:"requirements" jsonschema:"required"`
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
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=NA,enum=UNANSWERED,enum=ERROR"`
	// Checks to answer the requirement
	Checks map[string]*Check `yaml:"checks,omitempty" json:"checks" jsonschema:"required"`
}

// Contains information about a check
type Check struct {
	// Title of the check
	// Example "My Check"
	Title string `yaml:"title,omitempty" json:"title" jsonschema:"required"`
	// Type of the check
	// Example "autopilot"
	Type string `yaml:"type" json:"type" jsonschema:"required,enum=automation,enum=manual"`
	// Evaluation of the check containing the result
	Autopilots []Autopilot `yaml:"autopilots,omitempty" json:"autopilots" jsonschema:"optional"`
	// Evaluation of the autopilot
	Evaluation Evaluation `yaml:"evaluation" json:"evaluation" jsonschema:"required"`
}

// Contains the results of a check
type Autopilot struct {
	// Name of the autopilot
	Name string `yaml:"name" json:"name" jsonschema:"required"`
	// Steps of the autopilot
	Steps []Step `yaml:"steps" json:"steps" jsonschema:"required"`
}

// Contains the steps of an autopilot
type Step struct {
	// Title of the step
	Title string `yaml:"title" json:"title" jsonschema:"optional"`
	// Id of the step
	Id string `yaml:"id" json:"id" jsonschema:"required"`
	// Dependencies of the step
	Depends []string `yaml:"depends" json:"depends" jsonschema:"optional"`
	// Structured logs of the step, example:
	// - '{"source": "stdout", "json": {"result":{"criterion":"Fixed RTC ticket with ID 1588653 must be risk assessed","fulfilled":false,"justification":"Please type the appropriate risk assessment for RTC Ticket with ID 1588653.","metadata":{"Id":1588653,"test-json":{"key":"value"}}}}}'
	// - '{"source": "stdout", "text": "log message"}'
	// - '{"source": "stdout", "json": {"warning": "Your config file will be deprecated next month"}}'
	// - '{"source": "stdout", "json": {"message": "I am a message"}}'
	// - '{"source": "stderr", "text": "some error log"}'
	Logs []string `yaml:"logs" json:"logs" jsonschema:"required"`
	// Warning messages of the Step execution, derived from the generated structured logs
	Warnings []string `yaml:"warnings,omitempty" json:"warnings" jsonschema:"optional"`
	// General info messages of the Step execution, derived from the generated structured logs
	Messages []string `yaml:"messages,omitempty" json:"messages" jsonschema:"optional"`
	// Configuration files of the step
	ConfigFiles []string `yaml:"configFiles" json:"configFiles" jsonschema:"optional"`
	// Output directory of the step
	OutputDir string `yaml:"outputDir" json:"outputDir" jsonschema:"required"`
	// OutputFile of the step
	ResultFile string `yaml:"resultFile" json:"resultFile" jsonschema:"required"`
	// Input directories of the step
	InputDirs []string `yaml:"inputDirs" json:"inputDirs" jsonschema:"optional"`
	// Exit code of the step
	ExitCode int `yaml:"exitCode" json:"exitCode" jsonschema:"required"`
}

// Contains the evaluation of an autopilot
type Evaluation struct {
	// Status of the autopilot
	// Example "GREEN"
	Status string `yaml:"status" json:"status" jsonschema:"required, enum=GREEN,enum=YELLOW,enum=RED,enum=ERROR"`
	// Reason associated with the status
	// Example "This is my reason"
	Reason string `yaml:"reason" json:"reason" jsonschema:"required"`
	// Results of the autopilot
	Results []EvaluationResult `yaml:"results,omitempty" json:"results" jsonschema:"optional"`
	// Structured logs of the evaluation, example:
	// - '{"source": "stdout", "json": {"result":{"criterion":"Fixed RTC ticket with ID 1588653 must be risk assessed","fulfilled":false,"justification":"Please type the appropriate risk assessment for RTC Ticket with ID 1588653.","metadata":{"Id":1588653,"test-json":{"key":"value"}}}}}'
	// - '{"source": "stdout", "text": "log message"}'
	// - '{"source": "stdout", "json": {"warning": "Your config file will be deprecated next month"}}'
	// - '{"source": "stdout", "json": {"message": "I am a message"}}'
	// - '{"source": "stderr", "text": "some error log"}'
	Logs []string `yaml:"logs,omitempty" json:"logs" jsonschema:"required"`
	// Warning messages of the evaluation execution, derived from the generated structured logs
	Warnings []string `yaml:"warnings,omitempty" json:"warnings" jsonschema:"optional"`
	// General info messages of the evaluation execution, derived from the generated structured logs
	Messages []string `yaml:"messages,omitempty" json:"messages" jsonschema:"optional"`
	// Configuration files of the evaluation
	ConfigFiles []string `yaml:"configFiles,omitempty" json:"configFiles" jsonschema:"optional"`
	// Exit code of the evaluation
	ExitCode int `yaml:"exitCode,omitempty" json:"exitCode" jsonschema:"required"`
}

// Contains one of potentially many results reported by an autopilot
type EvaluationResult struct {
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

// Contains information about the finalization
type Finalize struct {
	// Structured logs from the execution of the finalizer
	// Example:
	// - '{"source": "stdout", "json": {"result":{"criterion":"Fixed RTC ticket with ID 1588653 must be risk assessed","fulfilled":false,"justification":"Please type the appropriate risk assessment for RTC Ticket with ID 1588653.","metadata":{"Id":1588653,"test-json":{"key":"value"}}}}}'
	// - '{"source": "stdout", "text": "log message"}'
	// - '{"source": "stdout", "json": {"warning": "Your config file will be deprecated next month"}}'
	// - '{"source": "stdout", "json": {"message": "I am a message"}}'
	// - '{"source": "stderr", "text": "some error log"}'
	Logs []string `yaml:"logs,omitempty" json:"logs" jsonschema:"optional"`
	// Warning messages of the Finalize execution, derived from the generated structured logs
	Warnings []string `yaml:"warnings,omitempty" json:"warnings" jsonschema:"optional"`
	// General info messages of the Finalize execution, derived from the generated structured logs
	Messages []string `yaml:"messages,omitempty" json:"messages" jsonschema:"optional"`
	// Configuration files of the finalizer
	ConfigFiles []string `yaml:"configFiles" json:"configFiles" jsonschema:"optional"`
	// Exit code of the autopilot
	ExitCode int `yaml:"exitCode" json:"exitCode" jsonschema:"required"`
}

func (r *Result) version() string {
	return "v2"
}
