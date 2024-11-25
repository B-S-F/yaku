// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

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
