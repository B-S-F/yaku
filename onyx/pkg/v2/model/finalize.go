package model

type Finalize struct {
	Env     map[string]string
	Configs map[string]string
	Run     string
}

type FinalizeResult struct {
	Logs       []LogEntry
	ExitCode   int
	OutputPath string
}
