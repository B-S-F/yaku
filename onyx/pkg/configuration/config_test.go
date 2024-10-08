//go:build unit
// +build unit

package configuration

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExecutionPlan_String(t *testing.T) {
	env := map[string]string{
		"foo": "bar",
	}
	items := []Item{
		{
			Chapter: Chapter{
				Id:    "1",
				Title: "Chapter 1",
				Text:  "This is chapter 1",
			},
			Requirement: Requirement{
				Id:    "1",
				Title: "Requirement 1",
				Text:  "This is requirement 1",
			},
			Check: Check{
				Id:    "1",
				Title: "Check 1",
			},
			Env: map[string]string{
				"foo": "bar",
			},
			Autopilot: Autopilot{
				Name: "autopilot1",
				Run:  "run1",
				Env: map[string]string{
					"foo": "bar",
				},
			},
		},
		{
			Chapter: Chapter{
				Id:    "1",
				Title: "Chapter 1",
				Text:  "This is chapter 1",
			},
			Requirement: Requirement{
				Id:    "1",
				Title: "Requirement 1",
				Text:  "This is requirement 1",
			},
			Check: Check{
				Id:    "2",
				Title: "Check 2",
			},
			Env: map[string]string{
				"foo": "bar",
			},
			Autopilot: Autopilot{
				Name: "autopilot2",
				Run:  "run2",
				Env: map[string]string{
					"foo": "bar",
				},
			},
		},
		{
			Chapter: Chapter{
				Id:    "2",
				Title: "Chapter 2",
				Text:  "This is chapter 2",
			},
			Requirement: Requirement{
				Id:    "2",
				Title: "Requirement 2",
				Text:  "This is requirement 2",
			},
			Check: Check{
				Id:    "1",
				Title: "Check 1",
			},
			Manual: Manual{
				Status: "YELLOW",
				Reason: "Reason",
			},
		},
	}

	finalize := Item{
		Autopilot: Autopilot{
			Name: "finalizer",
			Run:  "finalize",
			Env: map[string]string{
				"foo": "bar",
			},
		},
	}

	ep := ExecutionPlan{
		Env:      env,
		Items:    items,
		Finalize: finalize,
	}

	want := "Chapter: 1, Requirement: 1, Check: 1, Autopilot: autopilot1\nChapter: 1, Requirement: 1, Check: 2, Autopilot: autopilot2\nChapter: 2, Requirement: 2, Check: 1, Manual: YELLOW\n"
	got := ep.String()
	assert.Equal(t, want, got)
}
