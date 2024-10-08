package config

import (
	"testing"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
)

func TestCustomValidationForV2(t *testing.T) {
	type want struct {
		config interface{}
	}
	tests := map[string]struct {
		input interface{}
		want  error
	}{
		"invalid-id-when-contains-not-allowed-symbols": {
			input: &Config{
				Autopilots: map[string]Autopilot{
					"autopilots": {Steps: []Step{{ID: "invalidid$"}}},
				},
			},
			want: errors.New("invalid step id invalidid$: ID contains invalid characters. Only alphanumeric characters, dashes, and underscores are allowed."),
		},
		"invalid-id-when-contains-umlaut": {
			input: &Config{
				Autopilots: map[string]Autopilot{
					"autopilots": {Steps: []Step{{ID: "invalididÄ"}}},
				},
			},
			want: errors.New("invalid step id invalididÄ: ID contains invalid characters. Only alphanumeric characters, dashes, and underscores are allowed."),
		},
		"valid-name": {
			input: &Config{
				Autopilots: map[string]Autopilot{
					"autopilots": {Steps: []Step{{ID: "valid-name_here"}}},
				},
			},
			want: nil,
		},
		"valid-depends": {
			input: &Config{
				Autopilots: map[string]Autopilot{
					"autopilots": {Steps: []Step{{Depends: []string{"fetch1"}}, {ID: "fetch1"}}},
				},
			},
			want: nil,
		},
		"invalid-depends": {
			input: &Config{
				Autopilots: map[string]Autopilot{
					"autopilots": {Steps: []Step{{Depends: []string{"fetch1"}}}},
				},
			},
			want: errors.New("missing dependency fetch1"),
		},
		"invalid-check": {
			input: &Config{
				Chapters: map[string]Chapter{
					"chapter1": {
						Requirements: map[string]Requirement{
							"requirement1": {
								Checks: map[string]Check{
									"check1": {
										Manual: &Manual{
											Reason: "reason 1",
											Status: "passed",
										},
										Automation: &Automation{
											Env: map[string]string{
												"env1": "value1",
											},
											Autopilot: "autopilot1",
										},
									},
								},
							},
						},
					},
				},
			},
			want: errors.New("checks can't have both manual and automated checks"),
		},
		"valid-check": {
			input: &Config{
				Chapters: map[string]Chapter{
					"chapter1": {
						Requirements: map[string]Requirement{
							"requirement1": {
								Checks: map[string]Check{
									"check1": {
										Automation: &Automation{
											Env: map[string]string{
												"env1": "value1",
											},
											Autopilot: "autopilot1",
										},
									},
								},
							},
						},
					},
				},
			},
			want: nil,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			err := Validate(tt.input)
			assert.Equal(t, (err != nil), (tt.want != nil))
			if tt.want != nil {
				assert.EqualError(t, err, tt.want.Error())
			}
		})
	}
}
