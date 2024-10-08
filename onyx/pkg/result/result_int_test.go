//go:build integration
// +build integration

package result

import (
	"flag"
	"os"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/finalize"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/item"
	v1 "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	yaml "gopkg.in/yaml.v3"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

func TestResultIntegration(t *testing.T) {
	tmpDir := t.TempDir()
	var ep = &configuration.ExecutionPlan{
		Metadata: configuration.Metadata{
			Version: "v1",
		},
		Header: configuration.Header{
			Name:    "My Project",
			Version: "0.1.0",
		},
	}

	var itemResults = &[]item.Result{
		{
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
				EvidencePath: tmpDir,
				Outputs: map[string]string{
					"output": "output",
				},
			},
		},
		{
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
		},
	}
	t.Run("should create a result", func(t *testing.T) {
		// arrange
		var gotObj, wantObj map[string]interface{}
		resultFile := filepath.Join(tmpDir, "result.yaml")

		// act
		engine := NewDefaultEngine(tmpDir)
		engine.CreateNewResult(ep, itemResults)
		result := engine.GetResult()
		storeResult(t, result, resultFile)

		// assert
		got, err := os.ReadFile(resultFile)
		if err != nil {
			t.Fatal(err)
		}
		want := helper.GoldenValue(t, "result.golden", got, *update)
		err = yaml.Unmarshal(got, &gotObj)
		err = yaml.Unmarshal(want, &wantObj)
		if err != nil {
			t.Fatal(err)
		}
		ignoreKeys := []string{"date"}
		if !helper.MapsEqual(gotObj, wantObj, ignoreKeys, "") {
			t.Fail()
			assert.Equal(t, string(want), string(got))
			t.Logf("ignoreKeys: %v", ignoreKeys)
			t.Logf("golden file '%s' does not match the actual result", "result.golden")
		}
	})
	var finalizerResult = &finalize.Result{
		Config: &configuration.Item{},
		Output: &executor.Output{
			ExitCode:     0,
			Logs:         []string{"log"},
			ErrLogs:      []string{"err"},
			EvidencePath: tmpDir,
		},
	}
	t.Run("should append finalizer result to existing result", func(t *testing.T) {
		// arrange
		var gotObj, wantObj map[string]interface{}
		resultFile := filepath.Join(tmpDir, "result-with-finalizer.yaml")

		// act
		engine := NewDefaultEngine(tmpDir)
		engine.CreateNewResult(ep, &[]item.Result{})
		engine.AppendFinalizerResult(finalizerResult.Output)
		result := engine.GetResult()
		storeResult(t, result, resultFile)

		// assert
		got, err := os.ReadFile(resultFile)
		if err != nil {
			t.Fatal(err)
		}
		want := helper.GoldenValue(t, "result-with-finalizer.golden", got, *update)
		err = yaml.Unmarshal(got, &gotObj)
		err = yaml.Unmarshal(want, &wantObj)
		if err != nil {
			t.Fatal(err)
		}
		ignoreKeys := []string{"date", "degree-of-automation", "degree-of-completion"}
		if !helper.MapsEqual(gotObj, wantObj, ignoreKeys, "") {
			t.Fail()
			assert.Equal(t, string(want), string(got))
			t.Logf("ignoreKeys: %v", ignoreKeys)
			t.Logf("golden file '%s' does not match the actual result", "result-with-finalizer.golden")
		}
	})
}

func storeResult(t *testing.T, data *v1.Result, path string) {
	t.Helper()
	resultYaml, err := yaml.Marshal(data)
	if err != nil {
		t.Fatal(errors.Wrap(err, "failed to marshal result"))
	}
	err = os.WriteFile(path, resultYaml, 0644)
	if err != nil {
		t.Fatal(errors.Wrap(err, "failed to write result"))
	}
}
