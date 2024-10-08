//go:build unit
// +build unit

package result

import (
	"math"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/item"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/result/common"
	v1 "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var nopLogger = &logger.Log{
	Logger: zap.NewNop(),
}

func TestToPercent(t *testing.T) {
	testCases := map[string]struct {
		name        string
		numerator   uint
		denominator uint
		want        float64
	}{
		"should return percentage for a fraction": {
			numerator:   1,
			denominator: 2,
			want:        50.0,
		},

		"should limit the precision to two digits for a fraction": {
			numerator:   1,
			denominator: 3,
			want:        33.33,
		},
		"should return 0 for a zero fraction": {
			numerator:   0,
			denominator: 2,
			want:        0.0,
		},
		"should return 100 for a full fraction": {
			numerator:   2,
			denominator: 2,
			want:        100.0,
		},
		"should return infinty for division by zero": {
			numerator:   2,
			denominator: 0,
			want:        math.Inf(1),
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := toPercent(tc.numerator, tc.denominator)

			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}

var automationItemResult = item.Result{
	Config: &configuration.Item{
		Chapter: configuration.Chapter{
			Id:    "1",
			Title: "chapter title",
			Text:  "chapter text",
		},
		Requirement: configuration.Requirement{
			Id:    "1",
			Title: "requirement title",
			Text:  "requirement text",
		},
		Check: configuration.Check{
			Id:    "1",
			Title: "check title",
		},
	},
	Output: &executor.Output{
		ExecutionType: Automation,
		Status:        "GREEN",
		Reason:        "reason",
		Name:          "autopilot name",
		Results: []executor.Result{
			{
				Criterion:     "finding criteria",
				Fulfilled:     false,
				Justification: "finding reason",
			},
		},
		ExitCode:     0,
		Logs:         []string{"log"},
		ErrLogs:      []string{"err"},
		EvidencePath: "root/gedoens",
		Outputs: map[string]string{
			"output": "output",
		},
	},
}

var manualGreenItemResult = item.Result{
	Config: &configuration.Item{
		Chapter: configuration.Chapter{
			Id:    "2",
			Title: "chapter title",
			Text:  "chapter text",
		},
		Requirement: configuration.Requirement{
			Id:    "1",
			Title: "requirement title",
			Text:  "requirement text",
		},
		Check: configuration.Check{
			Id:    "1",
			Title: "check title",
		},
	},
	Output: &executor.Output{
		ExecutionType: Manual,
		Status:        "GREEN",
		Reason:        "reason",
	},
}

var manualUnansweredItemResult = item.Result{
	Config: &configuration.Item{
		Chapter: configuration.Chapter{
			Id:    "2",
			Title: "chapter title",
			Text:  "chapter text",
		},
		Requirement: configuration.Requirement{
			Id:    "1",
			Title: "requirement title",
			Text:  "requirement text",
		},
		Check: configuration.Check{
			Id:    "2",
			Title: "check title",
		},
	},
	Output: &executor.Output{
		ExecutionType: Manual,
		Status:        "UNANSWERED",
		Reason:        "Not answered",
	},
}

func TestCreateResult(t *testing.T) {
	t.Run("should create a new result from an execution plan and item results", func(t *testing.T) {
		// arrange
		itemResults := []item.Result{
			automationItemResult,
			manualGreenItemResult,
			manualUnansweredItemResult,
		}
		plan := configuration.ExecutionPlan{
			Metadata: configuration.Metadata{
				Version: "v1",
			},
			Header: configuration.Header{
				Name:    "config name",
				Version: "1.0.0",
			},
		}
		want := map[string]*v1.Chapter{
			"1": {
				Title:  "chapter title",
				Text:   "chapter text",
				Status: "GREEN",
				Requirements: map[string]*v1.Requirement{
					"1": {
						Title:  "requirement title",
						Text:   "requirement text",
						Status: "GREEN",
						Checks: map[string]*v1.Check{
							"1": {
								Title:  "check title",
								Status: "GREEN",
								Type:   "Automation",
								Evaluation: v1.CheckResult{
									Autopilot: "autopilot name",
									Status:    "GREEN",
									Reason:    "reason",
									Results: []v1.AutopilotResult{
										{
											Criterion:     "finding criteria",
											Fulfilled:     false,
											Justification: "finding reason",
										},
									},
									Outputs: map[string]string{
										"output": "output",
									},
									Execution: v1.ExecutionInformation{
										ExitCode:     0,
										Logs:         []string{"log"},
										ErrorLogs:    []string{"err"},
										EvidencePath: "gedoens",
									},
								},
							},
						},
					},
				},
			},
			"2": {
				Title:  "chapter title",
				Text:   "chapter text",
				Status: "GREEN",
				Requirements: map[string]*v1.Requirement{
					"1": {
						Title:  "requirement title",
						Text:   "requirement text",
						Status: "GREEN",
						Checks: map[string]*v1.Check{
							"1": {
								Title:  "check title",
								Status: "GREEN",
								Type:   "Manual",
								Evaluation: v1.CheckResult{
									Status: "GREEN",
									Reason: "reason",
								},
							},
							"2": {
								Title:  "check title",
								Status: "UNANSWERED",
								Evaluation: v1.CheckResult{
									Status: "UNANSWERED",
									Reason: "Not answered",
								},
							},
						},
					},
				},
			},
		}
		res := &DefaultResultEngine{
			rootPath: "root/",
			Result:   v1.Result{},
			logger:   nopLogger,
		}

		// act
		res.CreateNewResult(&plan, &itemResults)

		// assert
		compareTwoResults(t, want, res.Result.Chapters)
		assert.Nil(t, res.Result.Finalize)
		assert.Equal(t, "v1", res.Result.Metadata.Version)
		assert.Equal(t, "config name", res.Result.Header.Name)
		assert.Equal(t, "GREEN", res.Result.Chapters["1"].Status)
		assert.Equal(t, "GREEN", res.Result.Chapters["2"].Status)
		assert.Equal(t, "GREEN", res.Result.OverallStatus)
		assert.Equal(t, uint(3), res.Result.Statistics.CountChecks)
		assert.Equal(t, uint(1), res.Result.Statistics.CountAutomatedChecks)
		assert.Equal(t, uint(1), res.Result.Statistics.CountManualChecks)
		assert.Equal(t, uint(1), res.Result.Statistics.CountUnansweredChecks)
		assert.Equal(t, 33.33, res.Result.Statistics.PercentageAutomated)
		assert.Equal(t, 66.67, res.Result.Statistics.PercentageDone)
	})
}

func TestAppendFinalizerResult(t *testing.T) {
	t.Run("should append finalizer result", func(t *testing.T) {
		// arrange
		res := &DefaultResultEngine{
			rootPath: "root/",
			Result:   v1.Result{},
		}
		finalizerResult := &executor.Output{
			Logs:         []string{"Test Logs"},
			ErrLogs:      []string{"Test Error Logs"},
			ExitCode:     0,
			EvidencePath: "root/tmp/",
		}

		// act
		res.AppendFinalizerResult(finalizerResult)

		// assert
		assert.Equal(t, []string{"Test Logs"}, res.Result.Finalize.Execution.Logs)
		assert.Equal(t, []string{"Test Error Logs"}, res.Result.Finalize.Execution.ErrorLogs)
		assert.Equal(t, 0, res.Result.Finalize.Execution.ExitCode)
		assert.Equal(t, "tmp", res.Result.Finalize.Execution.EvidencePath)
	})
}

func TestGetResult(t *testing.T) {
	// arrange
	res := &DefaultResultEngine{
		Result: v1.Result{
			Metadata: v1.Metadata{
				Version: "1.0",
			},
		},
	}

	// act
	result := res.GetResult()

	// assert
	assert.Equal(t, "1.0", result.Metadata.Version)
}

func TestAddMetaInformation(t *testing.T) {
	t.Run("should add meta information to result", func(t *testing.T) {
		// arrange
		res := &DefaultResultEngine{
			Result: v1.Result{
				Metadata: v1.Metadata{},
				Header:   v1.Header{},
			},
		}
		executionPlan := &configuration.ExecutionPlan{
			Header: configuration.Header{
				Name:    "Test Plan",
				Version: "1.0",
			},
		}

		// act
		res.addMetaInformation(executionPlan)

		// assert
		assert.Equal(t, currentResultVersion, res.Result.Metadata.Version)
		assert.Equal(t, "Test Plan", res.Result.Header.Name)
		assert.Equal(t, "1.0", res.Result.Header.Version)
		assert.NotEmpty(t, res.Result.Header.Date)
		assert.Equal(t, helper.ToolVersion, res.Result.Header.ToolVersion)
	})
}

var itemConfig = &configuration.Item{
	Chapter: configuration.Chapter{
		Id:    "1",
		Title: "chapter title",
		Text:  "chapter text",
	},
	Requirement: configuration.Requirement{
		Id:    "1",
		Title: "requirement title",
		Text:  "requirement text",
	},
	Check: configuration.Check{
		Id:    "1",
		Title: "check title",
	},
}

func TestAddItemResult(t *testing.T) {
	testCases := map[string]struct {
		itemResult     item.Result
		wantResult     v1.Result
		wantStatistics v1.Statistics
	}{
		"should add item result": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Automation,
					Status:        "GREEN",
					Name:          "autopilot name",
					Results: []executor.Result{
						{
							Criterion:     "finding criteria",
							Fulfilled:     false,
							Justification: "finding reason",
						},
					},
					ExitCode:     0,
					Logs:         []string{"log"},
					ErrLogs:      []string{"err"},
					EvidencePath: "/tmp/gedoens",
					Outputs: map[string]string{
						"output": "output",
					},
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Type:  "Automation",
										Evaluation: v1.CheckResult{
											Autopilot: "autopilot name",
											Status:    "GREEN",
											Results: []v1.AutopilotResult{
												{
													Criterion:     "finding criteria",
													Fulfilled:     false,
													Justification: "finding reason",
												},
											},
											Outputs: map[string]string{
												"output": "output",
											},
											Execution: v1.ExecutionInformation{
												ExitCode:     0,
												Logs:         []string{"log"},
												ErrorLogs:    []string{"err"},
												EvidencePath: "gedoens",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:          1,
				CountAutomatedChecks: 1,
			},
		},
		"should add item result with findings metadata": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Automation,
					Status:        "GREEN",
					Name:          "autopilot name",
					Reason:        "Overall Reason",
					Results: []executor.Result{
						{
							Criterion:     "finding criteria",
							Fulfilled:     false,
							Justification: "finding reason",
							Metadata: map[string]string{
								"key1": "val1",
							},
						},
					},
					ExitCode:     0,
					Logs:         []string{"log"},
					ErrLogs:      []string{"err"},
					EvidencePath: "/tmp/gedoens",
					Outputs: map[string]string{
						"output": "output",
					},
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Type:  "Automation",
										Evaluation: v1.CheckResult{
											Autopilot: "autopilot name",
											Status:    "GREEN",
											Reason:    "Overall Reason",
											Results: []v1.AutopilotResult{
												{
													Criterion:     "finding criteria",
													Fulfilled:     false,
													Justification: "finding reason",
													Metadata: map[string]string{
														"key1": "val1",
													},
												},
											},
											Outputs: map[string]string{
												"output": "output",
											},
											Execution: v1.ExecutionInformation{
												ExitCode:     0,
												Logs:         []string{"log"},
												ErrorLogs:    []string{"err"},
												EvidencePath: "gedoens",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:          1,
				CountAutomatedChecks: 1,
			},
		},
		"should add a manually decided item": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Manual,
					Status:        "GREEN",
					Reason:        "reason",
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Type:  "Manual",
										Evaluation: v1.CheckResult{
											Status: "GREEN",
											Reason: "reason",
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:       1,
				CountManualChecks: 1,
			},
		},
		"should add a not implemented (unanswered) item": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Manual,
					Status:        "UNANSWERED",
					Reason:        "Not answered",
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Type:  "Manual",
										Evaluation: v1.CheckResult{
											Status: "UNANSWERED",
											Reason: "Not answered",
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:           1,
				CountUnansweredChecks: 1,
			},
		},
		"should add a skipped item": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Manual,
					Status:        "SKIPPED",
					Reason:        "Skipped",
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Type:  "Manual",
										Evaluation: v1.CheckResult{
											Status: "SKIPPED",
											Reason: "Skipped",
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:        1,
				CountSkippedChecks: 1,
			},
		},
		"should handle escape characters": {
			itemResult: item.Result{
				Config: itemConfig,
				Output: &executor.Output{
					ExecutionType: Automation,
					Status:        "GRE\nEN",
					Name:          "autopilot name",
					Results: []executor.Result{
						{
							Criterion:     "finding\ncriteria 1",
							Fulfilled:     false,
							Justification: "finding\nreason 1",
							Metadata: map[string]string{
								"meta\nkey": "meta\nvalue",
							},
						},
						{
							Criterion:     "finding\tcriteria 2",
							Fulfilled:     false,
							Justification: "finding\treason 2",
							Metadata: map[string]string{
								"meta\tkey": "meta\tvalue",
							},
						},
					},
					ExitCode:     0,
					Logs:         []string{"log"},
					ErrLogs:      []string{"err"},
					EvidencePath: "/tmp/gedoens",
					Outputs: map[string]string{
						"output\nkey 1": "output\nvalue 1",
						"output\tkey 2": "output\tvalue 2",
					},
				},
			},
			wantResult: v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Title: "chapter title",
						Text:  "chapter text",
						Requirements: map[string]*v1.Requirement{
							"1": {
								Title: "requirement title",
								Text:  "requirement text",
								Checks: map[string]*v1.Check{
									"1": {
										Title: "check title",
										Evaluation: v1.CheckResult{
											Autopilot: "autopilot name",
											Status:    "GRE\nEN",
											Results: []v1.AutopilotResult{
												{
													Criterion:     "finding\ncriteria 1",
													Fulfilled:     false,
													Justification: "finding\nreason 1",
													Metadata: map[string]string{
														"meta\nkey": "meta\nvalue",
													},
												},
												{
													Criterion:     "finding\tcriteria 2",
													Fulfilled:     false,
													Justification: "finding\treason 2",
													Metadata: map[string]string{
														"meta\tkey": "meta\tvalue",
													},
												},
											},
											Outputs: map[string]string{
												"output\nkey 1": "output\nvalue 1",
												"output\tkey 2": "output\tvalue 2",
											},
											Execution: v1.ExecutionInformation{
												ExitCode:     0,
												Logs:         []string{"log"},
												ErrorLogs:    []string{"err"},
												EvidencePath: "gedoens",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			wantStatistics: v1.Statistics{
				CountChecks:          1,
				CountAutomatedChecks: 1,
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			res := DefaultResultEngine{
				Result: v1.Result{
					Chapters: make(map[string]*v1.Chapter),
				},
				rootPath: "/tmp",
				logger:   nopLogger,
			}
			res.addItemResult(&tc.itemResult)
			assert.Equal(t, tc.wantStatistics, res.Result.Statistics)
			compareTwoResults(t, tc.wantResult.Chapters, res.Result.Chapters)
		})
	}
}

func TestCreateCheckResult(t *testing.T) {
	t.Run("should create check result from executor output", func(t *testing.T) {
		// arrange
		res := &DefaultResultEngine{
			rootPath: "root/",
		}
		output := &executor.Output{
			Name:   "Test Autopilot",
			Status: "GREEN",
			Reason: "Test Reason",
			Results: []executor.Result{
				{
					Criterion:     "Test Criterion",
					Fulfilled:     true,
					Justification: "Test Justification",
					Metadata:      map[string]string{"metadata": "value"},
				},
			},
			Outputs:      map[string]string{"output": "value"},
			Logs:         []string{"Test Logs"},
			ErrLogs:      []string{"Test Error Logs"},
			ExitCode:     0,
			EvidencePath: "root/tmp/",
		}

		// act
		result := res.createCheckResult(output)

		// assert
		assert.Equal(t, "Test Autopilot", result.Autopilot)
		assert.Equal(t, "GREEN", result.Status)
		assert.Equal(t, "Test Reason", result.Reason)
		assert.Len(t, result.Results, 1)
		assert.Equal(t, common.MultilineString("Test Criterion"), result.Results[0].Criterion)
		assert.True(t, result.Results[0].Fulfilled)
		assert.Equal(t, common.MultilineString("Test Justification"), result.Results[0].Justification)
		assert.Equal(t, common.StringMap{"metadata": "value"}, result.Results[0].Metadata)
		assert.Equal(t, map[string]string{"output": "value"}, result.Outputs)
		assert.Equal(t, []string{"Test Logs"}, result.Execution.Logs)
		assert.Equal(t, []string{"Test Error Logs"}, result.Execution.ErrorLogs)
		assert.Equal(t, 0, result.Execution.ExitCode)
		assert.Equal(t, "tmp", result.Execution.EvidencePath)
	})
}

func TestGetChapter(t *testing.T) {
	t.Run("should create new result chapter", func(t *testing.T) {
		// arrange
		chapters := make(map[string]*v1.Chapter)
		requestedChapter := &configuration.Chapter{
			Id:    "1",
			Title: "Test Chapter",
			Text:  "This is a test chapter.",
		}

		// act
		chapter := getChapter(chapters, requestedChapter)

		// assert
		assert.Equal(t, "Test Chapter", chapter.Title)
		assert.Equal(t, "This is a test chapter.", chapter.Text)
		assert.NotNil(t, chapter.Requirements)
		assert.Equal(t, chapter, chapters["1"])
	})

	t.Run("should return existing result chapter", func(t *testing.T) {
		// arrange
		requestedChapter := &configuration.Chapter{
			Id: "1",
		}
		chapters := map[string]*v1.Chapter{
			"1": {
				Title: "Test Chapter",
				Text:  "This is a test chapter.",
			},
		}

		// act
		chapter := getChapter(chapters, requestedChapter)

		// assert
		assert.Equal(t, "Test Chapter", chapter.Title)
		assert.Equal(t, "This is a test chapter.", chapter.Text)
		assert.Equal(t, chapter, chapters["1"])
	})
}

func TestGetRequirement(t *testing.T) {
	t.Run("should create new result requirement", func(t *testing.T) {
		// arrange
		requirements := make(map[string]*v1.Requirement)
		requestedRequirement := &configuration.Requirement{
			Id:    "1",
			Title: "Test Requirement",
			Text:  "This is a test requirement.",
		}

		// act
		requirement := getRequirement(requirements, requestedRequirement)

		// assert
		assert.Equal(t, "Test Requirement", requirement.Title)
		assert.Equal(t, "This is a test requirement.", requirement.Text)
		assert.NotNil(t, requirement.Checks)
		assert.Equal(t, requirement, requirements["1"])
	})

	t.Run("should return existing result requirement", func(t *testing.T) {
		// arrange
		requestedRequirement := &configuration.Requirement{
			Id: "1",
		}
		requirements := map[string]*v1.Requirement{
			"1": {
				Title: "Test Requirement",
				Text:  "This is a test requirement.",
			},
		}

		// act
		requirement := getRequirement(requirements, requestedRequirement)

		// assert
		assert.Equal(t, "Test Requirement", requirement.Title)
		assert.Equal(t, "This is a test requirement.", requirement.Text)
		assert.Equal(t, requirement, requirements["1"])
	})
}

func TestGetCheck(t *testing.T) {
	t.Run("should create new result check", func(t *testing.T) {
		// arrange
		checks := make(map[string]*v1.Check)
		requestedCheck := &configuration.Check{
			Id:    "1",
			Title: "Test Check",
		}

		// act
		check := getCheck(checks, requestedCheck)

		// assert
		assert.Equal(t, "Test Check", check.Title)
		assert.Equal(t, check, checks["1"])
	})

	t.Run("should return existing result check", func(t *testing.T) {
		// arrange
		requestedCheck := &configuration.Check{
			Id: "1",
		}
		checks := map[string]*v1.Check{
			"1": {
				Title: "Test Check",
			},
		}

		// act
		check := getCheck(checks, requestedCheck)

		// assert
		assert.Equal(t, "Test Check", check.Title)
		assert.Equal(t, check, checks["1"])
	})
}

func TestComputeCheckStatus(t *testing.T) {
	t.Run("should compute check status", func(t *testing.T) {
		// arrange
		check := &v1.Check{
			Evaluation: v1.CheckResult{
				Status: GREEN,
			},
		}

		// act
		computeCheckStatus(check)

		// assert
		assert.Equal(t, GREEN, check.Status)
	})
}

func TestComputeRequirementStatus(t *testing.T) {
	testCases := map[string]struct {
		requirement *v1.Requirement
		want        string
	}{
		"should compute requirement status for single check": {
			requirement: &v1.Requirement{
				Checks: map[string]*v1.Check{
					"1": {
						Evaluation: v1.CheckResult{
							Status: GREEN,
						},
					},
				},
			},
			want: GREEN,
		},
		"should compute requirement status for multiple checks": {
			requirement: &v1.Requirement{
				Checks: map[string]*v1.Check{
					"1": {
						Evaluation: v1.CheckResult{
							Status: GREEN,
						},
					},
					"2": {
						Evaluation: v1.CheckResult{
							Status: RED,
						},
					},
				},
			},
			want: RED,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			computeRequirementStatus(tc.requirement)

			// assert
			assert.Equal(t, tc.want, tc.requirement.Status)
		})
	}
}

func TestComputeChaptertStatus(t *testing.T) {
	testCases := map[string]struct {
		chapter *v1.Chapter
		want    string
	}{
		"should compute chapter status for single requirement": {
			chapter: &v1.Chapter{
				Requirements: map[string]*v1.Requirement{
					"1": {
						Checks: map[string]*v1.Check{
							"1": {
								Evaluation: v1.CheckResult{
									Status: GREEN,
								},
							},
						},
					},
				},
			},
			want: GREEN,
		},
		"should compute chapter status for multiple requirement": {
			chapter: &v1.Chapter{
				Requirements: map[string]*v1.Requirement{
					"1": {
						Checks: map[string]*v1.Check{
							"1": {
								Evaluation: v1.CheckResult{
									Status: GREEN,
								},
							},
						},
					},
					"2": {
						Checks: map[string]*v1.Check{
							"1": {
								Evaluation: v1.CheckResult{
									Status: RED,
								},
							},
						},
					},
				},
			},
			want: RED,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			computeChapterStatus(tc.chapter)

			// assert
			assert.Equal(t, tc.want, tc.chapter.Status)
		})
	}
}

func TestComputeResulttStatus(t *testing.T) {
	testCases := map[string]struct {
		result *v1.Result
		want   string
	}{
		"should compute result status for single chapter": {
			result: &v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Requirements: map[string]*v1.Requirement{
							"1": {
								Checks: map[string]*v1.Check{
									"1": {
										Evaluation: v1.CheckResult{
											Status: GREEN,
										},
									},
								},
							},
						},
					},
				},
			},
			want: GREEN,
		},
		"should compute result status for multiple requirement": {
			result: &v1.Result{
				Chapters: map[string]*v1.Chapter{
					"1": {
						Requirements: map[string]*v1.Requirement{
							"1": {
								Checks: map[string]*v1.Check{
									"1": {
										Evaluation: v1.CheckResult{
											Status: GREEN,
										},
									},
								},
							},
						},
					},
					"2": {
						Requirements: map[string]*v1.Requirement{
							"1": {
								Checks: map[string]*v1.Check{
									"1": {
										Evaluation: v1.CheckResult{
											Status: RED,
										},
									},
								},
							},
						},
					},
				},
			},
			want: RED,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			computeResultStatus(tc.result)

			// assert
			assert.Equal(t, tc.want, tc.result.OverallStatus)
		})
	}
}

func TestDetermineCombinedStatus(t *testing.T) {
	testCases := map[string]struct {
		currentStatus string
		newStatus     string
		want          string
	}{
		"GREEN and GREEN should be GREEN": {
			currentStatus: GREEN,
			newStatus:     GREEN,
			want:          GREEN,
		},
		"GREEN and YELLOW should be YELLOW": {
			currentStatus: GREEN,
			newStatus:     YELLOW,
			want:          YELLOW,
		},
		"GREEN and RED should be RED": {
			currentStatus: GREEN,
			newStatus:     RED,
			want:          RED,
		},
		"GREEN and NA should be GREEN": {
			currentStatus: GREEN,
			newStatus:     v1.NA,
			want:          GREEN,
		},
		"YELLOW and RED should be RED": {
			currentStatus: YELLOW,
			newStatus:     RED,
			want:          RED,
		},
		"UNANSWERED and RED should be RED": {
			currentStatus: UNANSWERED,
			newStatus:     RED,
			want:          RED,
		},
		"RED and FAILED should be FAILED": {
			currentStatus: RED,
			newStatus:     v1.FAILED,
			want:          v1.FAILED,
		},
		"Empty status and GREEN should be GREEN": {
			currentStatus: "",
			newStatus:     GREEN,
			want:          GREEN,
		},
		"GREEN and SKIPPED should be GREEN": {
			currentStatus: GREEN,
			newStatus:     v1.SKIPPED,
			want:          GREEN,
		},
		"UNANSWERED and SKIPPED should be SKIPPED": {
			currentStatus: UNANSWERED,
			newStatus:     v1.SKIPPED,
			want:          v1.SKIPPED,
		},
		"NA and UNANSWERED should be UNANSWERED": {
			currentStatus: v1.NA,
			newStatus:     UNANSWERED,
			want:          UNANSWERED,
		},
		"FAILED and ERROR should be ERROR": {
			currentStatus: v1.FAILED,
			newStatus:     ERROR,
			want:          ERROR,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := determineCombinedStatus(tc.currentStatus, tc.newStatus)

			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}
