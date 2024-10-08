package model

type RunResult struct {
	Manuals    []ManualRun
	Autopilots []AutopilotRun
}

type ManualRun struct {
	ManualCheck ManualCheck
	Result      *ManualResult
}

type AutopilotRun struct {
	AutopilotCheck AutopilotCheck
	Result         *AutopilotResult
}
