//go:build unit
// +build unit

package transformer

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/stretchr/testify/assert"
)

func TestAutopilotSkipperTransform(t *testing.T) {
	testCases := map[string]struct {
		execParams parameter.ExecutionParameter
		ep         *configuration.ExecutionPlan
		want       *configuration.ExecutionPlan
		wantErr    bool
	}{
		"should return nil when no checkIdentifier is set": {
			execParams: parameter.ExecutionParameter{},
			ep: &configuration.ExecutionPlan{
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
					},
				},
			},
			want: &configuration.ExecutionPlan{
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
					},
				},
			},
			wantErr: false,
		},
		"should return nil and transform execution plan when checkIdentifier is set and check is found": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter1_Requirement1_Check1",
			},
			ep: &configuration.ExecutionPlan{
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
			},
			want: &configuration.ExecutionPlan{
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
			},
			wantErr: false,
		},
		"should return error when checkIdentifier is set and check is not found": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter2_Requirement1_Check1",
			},
			ep:      &configuration.ExecutionPlan{},
			want:    &configuration.ExecutionPlan{},
			wantErr: true,
		},
		"should return error when checkIdentifier is set and found check is manual answer": {
			execParams: parameter.ExecutionParameter{
				CheckIdentifier: "Chapter1_Requirement2_Check1",
			},
			ep:      &configuration.ExecutionPlan{},
			want:    &configuration.ExecutionPlan{},
			wantErr: true,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			d := NewAutopilotSkipper(tc.execParams)

			// act
			err := d.Transform(tc.ep)

			// assert
			if tc.wantErr {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, tc.want, tc.ep)
		})
	}
}

func TestSkipItem(t *testing.T) {
	testCases := map[string]struct {
		checkIdentifier parameter.CheckIdentifier
		item            configuration.Item
		want            bool
	}{
		"should return true when chapter does not match": {
			checkIdentifier: parameter.CheckIdentifier{
				Chapter:     "Chapter1",
				Requirement: "Requirement1",
				Check:       "Check1",
			},
			item: configuration.Item{
				Chapter: configuration.Chapter{
					Id: "Chapter2",
				},
				Requirement: configuration.Requirement{
					Id: "Requirement1",
				},
				Check: configuration.Check{
					Id: "Check1",
				},
			},
			want: true,
		},
		"should return true when requirement does not match": {
			checkIdentifier: parameter.CheckIdentifier{
				Chapter:     "Chapter1",
				Requirement: "Requirement1",
				Check:       "Check1",
			},
			item: configuration.Item{
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
			want: true,
		},
		"should return true when check does not match": {
			checkIdentifier: parameter.CheckIdentifier{
				Chapter:     "Chapter1",
				Requirement: "Requirement1",
				Check:       "Check1",
			},
			item: configuration.Item{
				Chapter: configuration.Chapter{
					Id: "Chapter1",
				},
				Requirement: configuration.Requirement{
					Id: "Requirement1",
				},
				Check: configuration.Check{
					Id: "Check2",
				},
			},
			want: true,
		},
		"should return false when item matches checkIdentifier": {
			checkIdentifier: parameter.CheckIdentifier{
				Chapter:     "Chapter1",
				Requirement: "Requirement1",
				Check:       "Check1",
			},
			item: configuration.Item{
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
			want: false,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := skipItem(tc.item, tc.checkIdentifier)

			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}
