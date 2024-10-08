package app

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestAppReferences(t *testing.T) {
	testCases := []struct {
		expected []*app.Reference
		name     string
		ep       *model.ExecutionPlan
	}{
		{
			name: "should return all app references",
			ep: &model.ExecutionPlan{AutopilotChecks: []model.AutopilotCheck{{
				AppReferences: []*configuration.AppReference{
					{
						Name:       "app1",
						Version:    "1.0.0",
						Repository: "test",
					},
					{
						Name:       "app2",
						Version:    "0.2.0",
						Repository: "test",
					},
				}}}},
			expected: []*app.Reference{
				{
					Name:       "app1",
					Version:    "1.0.0",
					Repository: "test",
				},
				{
					Name:       "app2",
					Version:    "0.2.0",
					Repository: "test",
				},
			}},
		{
			name:     "should return nil",
			ep:       &model.ExecutionPlan{ManualChecks: []model.ManualCheck{model.ManualCheck{}}},
			expected: nil},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := AppReferences(tc.ep)
			assert.Equal(t, tc.expected, actual)
		})
	}
}
