package result

import (
	"testing"

	v1 "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/stretchr/testify/assert"
)

func compareTwoResults(t *testing.T, res1 map[string]*v1.Chapter, res2 map[string]*v1.Chapter) {
	t.Helper()
	assert.Equal(t, len(res1), len(res2))
	for k, v1 := range res1 {
		v2, ok := res2[k]
		assert.True(t, ok)
		assert.Equal(t, v1.Title, v2.Title)
		assert.Equal(t, v1.Text, v2.Text)
		compareRequirements(t, v1.Requirements, v2.Requirements)
	}
}

func compareRequirements(t *testing.T, req1 map[string]*v1.Requirement, req2 map[string]*v1.Requirement) {
	t.Helper()
	assert.Equal(t, len(req1), len(req2))
	for k, v1 := range req1 {
		v2, ok := req2[k]
		assert.True(t, ok)
		assert.Equal(t, v1.Title, v2.Title)
		assert.Equal(t, v1.Text, v2.Text)
		compareChecks(t, v1.Checks, v2.Checks)
	}
}

func compareChecks(t *testing.T, c1 map[string]*v1.Check, c2 map[string]*v1.Check) {
	t.Helper()
	assert.Equal(t, len(c1), len(c2))
	for k, v1 := range c1 {
		v2, ok := c2[k]
		assert.True(t, ok)
		assert.Equal(t, v1.Title, v2.Title)
		assert.Equal(t, v1.Status, v2.Status)
		assert.Equal(t, v1.Evaluation, v2.Evaluation)
	}
}
