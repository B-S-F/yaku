package config

import (
	"testing"

	model "github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_newStepGraph(t *testing.T) {
	type args struct {
		steps []model.Step
	}
	tests := map[string]struct {
		args args
		want stepGraph
	}{
		"one-node": {
			args: args{steps: []model.Step{{ID: "step0"}}},
			want: stepGraph{
				adjList:   map[string][]string{"step0": {}},
				inDegree:  map[string]int{"step0": 0},
				stepsByID: map[string]model.Step{"step0": {ID: "step0"}},
			},
		},
		"two-nodes": {
			args: args{steps: []model.Step{{ID: "step0"}, {ID: "step1"}}},
			want: stepGraph{
				adjList:   map[string][]string{"step0": {}, "step1": {}},
				inDegree:  map[string]int{"step0": 0, "step1": 0},
				stepsByID: map[string]model.Step{"step0": {ID: "step0"}, "step1": {ID: "step1"}},
			},
		},
		"multiple-starting-nodes-with-dependencies": {
			args: args{steps: []model.Step{
				{ID: "step0"},
				{ID: "step1"},
				{ID: "step2", Depends: []string{"step1", "step5"}},
				{ID: "step3", Depends: []string{"step1"}},
				{ID: "step4", Depends: []string{"step2", "step3"}},
				{ID: "step5", Depends: []string{"step6"}},
				{ID: "step6", Depends: []string{"step1", "step0"}},
			}},
			want: stepGraph{
				adjList: map[string][]string{
					"step0": {"step6"},
					"step1": {"step2", "step3", "step6"},
					"step2": {"step4"},
					"step3": {"step4"},
					"step4": {},
					"step5": {"step2"},
					"step6": {"step5"},
				},
				inDegree: map[string]int{
					"step0": 0,
					"step1": 0,
					"step2": 2,
					"step3": 1,
					"step4": 2,
					"step5": 1,
					"step6": 2,
				},
				stepsByID: map[string]model.Step{
					"step0": {ID: "step0"},
					"step1": {ID: "step1"},
					"step2": {ID: "step2", Depends: []string{"step1", "step5"}},
					"step3": {ID: "step3", Depends: []string{"step1"}},
					"step4": {ID: "step4", Depends: []string{"step2", "step3"}},
					"step5": {ID: "step5", Depends: []string{"step6"}},
					"step6": {ID: "step6", Depends: []string{"step1", "step0"}},
				},
			},
		},
		"one-node-with-cycle": {
			args: args{steps: []model.Step{{ID: "step0", Depends: []string{"step0"}}}},
			want: stepGraph{
				adjList:   map[string][]string{"step0": {"step0"}},
				inDegree:  map[string]int{"step0": 1},
				stepsByID: map[string]model.Step{"step0": {ID: "step0", Depends: []string{"step0"}}},
			},
		},
		"non-existing-step-as-dependency": {
			args: args{steps: []model.Step{{ID: "step0", Depends: []string{"non-existing"}}}},
			want: stepGraph{
				adjList:   map[string][]string{"non-existing": {"step0"}, "step0": {}},
				inDegree:  map[string]int{"step0": 1},
				stepsByID: map[string]model.Step{"step0": {ID: "step0", Depends: []string{"non-existing"}}},
			},
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got := newStepGraph(tt.args.steps)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_stepGraph_isCyclic(t *testing.T) {
	type fields struct {
		adjList map[string][]string
	}
	tests := map[string]struct {
		fields fields
		want   bool
	}{
		"one-node": {
			fields: fields{adjList: map[string][]string{
				"step0": {},
			}},
			want: false,
		},
		"multiple-starting-nodes-with-dependencies": {
			fields: fields{adjList: map[string][]string{
				"step0": {"step6"},
				"step1": {"step2", "step3", "step6"},
				"step2": {"step4"},
				"step3": {"step4"},
				"step4": {},
				"step5": {"step2"},
				"step6": {"step5"},
			}},
			want: false,
		},
		"one-node-with-cycle": {
			fields: fields{adjList: map[string][]string{
				"step0": {"step0"},
			}},
			want: true,
		},
		"multiple-starting-nodes-with-dependencies-and-cycle": {
			fields: fields{adjList: map[string][]string{
				"step0": {"step6"},
				"step1": {"step2", "step3", "step6"},
				"step2": {"step4", "step0"},
				"step3": {"step4"},
				"step4": {},
				"step5": {"step2"},
				"step6": {"step5"},
			}},
			want: true,
		},
		"three-disconnected-graphs-one-with-cycle": {
			fields: fields{adjList: map[string][]string{
				"step0": {"step1", "step3"},
				"step1": {"step2", "step3"},
				"step2": {"step3"},
				"step3": {},
				"step4": {"step5"},
				"step5": {"step4"},
				"step6": {},
			}},
			want: true,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			g := &stepGraph{
				adjList: tt.fields.adjList,
			}
			got := g.hasCycle()
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_stepGraph_topologicalSort(t *testing.T) {
	tests := map[string]struct {
		input []model.Step
		want  [][]model.Step
	}{
		"one-step": {
			input: []model.Step{{ID: "step0"}},
			want:  [][]model.Step{{{ID: "step0"}}},
		},
		"two-steps-without-dependencies": {
			input: []model.Step{{ID: "step0"}, {ID: "step1"}},
			want:  [][]model.Step{{{ID: "step0"}, {ID: "step1"}}},
		},
		"multiple-starting-steps-with-dependencies": {
			input: []model.Step{
				{ID: "step0"},
				{ID: "step1"},
				{ID: "step2", Depends: []string{"step1", "step5"}},
				{ID: "step3", Depends: []string{"step1"}},
				{ID: "step4", Depends: []string{"step2", "step3"}},
				{ID: "step5", Depends: []string{"step6"}},
				{ID: "step6", Depends: []string{"step1", "step0"}},
			},
			want: [][]model.Step{
				{{ID: "step0"}, {ID: "step1"}},
				{{ID: "step3", Depends: []string{"step1"}}, {ID: "step6", Depends: []string{"step1", "step0"}}},
				{{ID: "step5", Depends: []string{"step6"}}},
				{{ID: "step2", Depends: []string{"step1", "step5"}}},
				{{ID: "step4", Depends: []string{"step2", "step3"}}},
			},
		},
		"multiple-disconnected-steps": {
			input: []model.Step{
				{ID: "step0"},
				{ID: "step1", Depends: []string{"step0"}},
				{ID: "step2", Depends: []string{"step1"}},
				{ID: "step3", Depends: []string{"step0", "step1", "step2"}},
				{ID: "step4"},
				{ID: "step5", Depends: []string{"step4"}},
				{ID: "step6"},
			},
			want: [][]model.Step{
				{{ID: "step0"}, {ID: "step4"}, {ID: "step6"}},
				{{ID: "step1", Depends: []string{"step0"}}, {ID: "step5", Depends: []string{"step4"}}},
				{{ID: "step2", Depends: []string{"step1"}}},
				{{ID: "step3", Depends: []string{"step0", "step1", "step2"}}},
			},
		},
		"one-step-with-cycle": {
			input: []model.Step{
				{ID: "step0", Depends: []string{"step0"}},
			},
			want: nil,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			g := newStepGraph(tt.input)
			got := g.topologicalSort()

			require.Equal(t, len(tt.want), len(got))
			for i := 0; i < len(tt.want); i++ {
				assert.ElementsMatch(t, tt.want[i], got[i])
			}
		})
	}
}
