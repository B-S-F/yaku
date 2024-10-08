//go:build unit
// +build unit

package transformer

import (
	"errors"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestAutopilotSkipperTransform(t *testing.T) {
	type want struct {
		ep  *model.ExecutionPlan
		err error
	}
	testCases := map[string]struct {
		execParams parameter.ExecutionParameter
		ep         *model.ExecutionPlan
		want       want
	}{
		"should return nil when no checkIdentifier is set": {
			execParams: parameter.ExecutionParameter{},
			ep: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
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
				}}}},
			want: want{
				ep: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
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
					}}}},
				err: nil,
			},
		},
		"should return nil and skip manual auto pilots in execution plan when checkIdentifier is set and check is found": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter1_Requirement1_Check1",
			},
			ep: &model.ExecutionPlan{
				AutopilotChecks: []model.AutopilotCheck{{
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
					}},
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
				}},
			want: want{
				ep: &model.ExecutionPlan{
					AutopilotChecks: []model.AutopilotCheck{{
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
						}},
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
				},
				err: nil,
			},
		},
		"should return error when checkIdentifier is set and check is not found": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter2_Requirement1_Check1",
			},
			ep: &model.ExecutionPlan{},
			want: want{
				ep:  &model.ExecutionPlan{},
				err: errors.New("Check 'Chapter2_Requirement1_Check1' not found"),
			},
		},
		"should return error when checkIdentifier is set and found check is manual answer": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter1_Requirement2_Check1",
			},
			ep: &model.ExecutionPlan{},
			want: want{
				ep:  &model.ExecutionPlan{},
				err: errors.New("Check 'Chapter1_Requirement2_Check1' not found"),
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			d := NewAutopilotSkipper(tc.execParams)

			// act
			err := d.Transform(tc.ep)

			// assert
			if tc.want.err != nil {
				assert.EqualError(t, tc.want.err, err.Error())
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, tc.want.ep, tc.ep)
		})
	}
}
