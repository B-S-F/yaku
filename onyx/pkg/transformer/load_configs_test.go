//go:build unit
// +build unit

package transformer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/stretchr/testify/assert"
)

func TestConfigsLoaderTransform(t *testing.T) {
	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.txt")
	err := os.WriteFile(configFile, []byte("config content"), 0644)
	if err != nil {
		t.Fatal(err)
	}

	testCases := map[string]struct {
		ep   *configuration.ExecutionPlan
		want *configuration.ExecutionPlan
	}{
		"should load config file and add it to the ExecutionPlan": {
			ep: &configuration.ExecutionPlan{
				Items: []configuration.Item{
					{
						Config: map[string]string{
							"config.txt": "",
						},
					},
				},
			},
			want: &configuration.ExecutionPlan{
				Items: []configuration.Item{
					{
						Config: map[string]string{
							"config.txt": "config content",
						},
					},
				},
			},
		},
		"should not load config file but continue if it does not exist": {
			ep: &configuration.ExecutionPlan{
				Items: []configuration.Item{
					{
						Config: map[string]string{
							"config2.txt": "",
						},
					},
				},
			},
			want: &configuration.ExecutionPlan{
				Items: []configuration.Item{
					{
						Config: map[string]string{
							"config2.txt": "",
						},
					},
				},
			},
		},
		"should load config file for finalizer": {
			ep: &configuration.ExecutionPlan{
				Finalize: configuration.Item{
					Config: map[string]string{
						"config.txt": "",
					},
				},
			},
			want: &configuration.ExecutionPlan{
				Finalize: configuration.Item{
					Config: map[string]string{
						"config.txt": "config content",
					},
				},
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			d := NewConfigsLoader(tmpDir)
			err := d.Transform(tc.ep)
			assert.NoError(t, err)
			assert.Equal(t, tc.want, tc.ep)
		})
	}
}
