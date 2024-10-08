//go:build integration
// +build integration

package transformer

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/stretchr/testify/assert"
)

func TestTransformIntegration(t *testing.T) {
	t.Run("should transform the execution plan with configs", func(t *testing.T) {
		// arrange
		ep := &configuration.ExecutionPlan{
			Items: []configuration.Item{
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement1",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Config: map[string]string{
						"config.yaml": "",
					},
				},
			},
		}
		c := NewConfigsLoader("testdata")
		wantConfig := map[string]string{
			"config.yaml": "config: config",
		}

		// act
		err := c.Transform(ep)

		// assert
		assert.NoError(t, err)
		assert.Equal(t, wantConfig, ep.Items[0].Config)
	})

	t.Run("should transform the execution plan with skipped autopilots", func(t *testing.T) {
		// arrange
		s := NewAutopilotSkipper(parameter.ExecutionParameter{
			CheckIdentifier: "Chapter1_Requirement1_Check1",
		})
		ep := &configuration.ExecutionPlan{
			Items: []configuration.Item{
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement1",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Config: map[string]string{
						"config.yaml": "",
					},
				},
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement2",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Manual: configuration.Manual{
						Status: "GREEN",
					},
				},
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement3",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Manual: configuration.Manual{
						Status: "NA",
					},
				},
			},
		}
		want := &configuration.ExecutionPlan{
			Items: []configuration.Item{
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement1",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Config: map[string]string{
						"config.yaml": "",
					},
				},
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement2",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Manual: configuration.Manual{
						Status: "SKIPPED",
						Reason: "Skipped due to single check execution",
					},
				},
				{
					Chapter: configuration.Chapter{
						Id: "Chapter1",
					},
					Requirement: configuration.Requirement{
						Id: "Requirement3",
					},
					Check: configuration.Check{
						Id: "Check1",
					},
					Manual: configuration.Manual{
						Status: "NA",
					},
				},
			},
		}

		// act
		err := s.Transform(ep)

		// assert
		assert.NoError(t, err)
		assert.Equal(t, want, ep)
	})
}
