//go:build integration
// +build integration

package transformer

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestTransformIntegration(t *testing.T) {
	t.Run("should transform the execution plan with skipped autopilots and load config files", func(t *testing.T) {
		// arrange
		skipper := NewAutopilotSkipper(parameter.ExecutionParameter{
			CheckIdentifier: "Chapter1_Requirement1_Check1",
		})
		loader := NewConfigsLoader("testdata")
		ep := &model.ExecutionPlan{
			AutopilotChecks: []model.AutopilotCheck{
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement1",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Autopilot: model.Autopilot{
						Steps: [][]model.Step{
							{
								{
									Configs: map[string]string{
										"config.yaml":  "",
										"missing.yaml": "",
									},
								},
							},
						},
						Evaluate: model.Evaluate{
							Configs: map[string]string{
								"config2.yaml": "",
							},
						},
					},
				},
			},
			ManualChecks: []model.ManualCheck{
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement2",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Manual: configuration.Manual{
						Status: "GREEN",
					},
				},
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement3",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Manual: configuration.Manual{
						Status: "NA",
					},
				},
			},
		}
		want := &model.ExecutionPlan{
			AutopilotChecks: []model.AutopilotCheck{
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement1",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Autopilot: model.Autopilot{
						Steps: [][]model.Step{
							{
								{
									Configs: map[string]string{
										"config.yaml":  "config: config",
										"missing.yaml": "",
									},
								},
							},
						},
						Evaluate: model.Evaluate{
							Configs: map[string]string{
								"config2.yaml": "config: content",
							},
						},
					},
				},
			},
			ManualChecks: []model.ManualCheck{
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement2",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Manual: configuration.Manual{
						Status: "SKIPPED",
						Reason: "Skipped due to single check execution",
					},
				},
				{
					Item: model.Item{
						Chapter: configuration.Chapter{
							Id: "Chapter1",
						},
						Requirement: configuration.Requirement{
							Id: "Requirement3",
						},
						Check: configuration.Check{
							Id: "Check1",
						},
					},
					Manual: configuration.Manual{
						Status: "NA",
					},
				},
			},
			Finalize: &model.Finalize{},
		}

		// act
		err := skipper.Transform(ep)
		// assert
		assert.NoError(t, err)
		err = loader.Transform(ep)
		// assert
		assert.NoError(t, err)
		assert.Equal(t, want, ep)
	})
}
