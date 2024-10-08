//go:build integration
// +build integration

package schema

import (
	"encoding/json"
	"flag"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/stretchr/testify/assert"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

func TestSchemaCommandIntegration(t *testing.T) {
	testCases := []struct {
		name     string
		schema   string
		golden   string
		expected map[string]interface{}
	}{
		{
			name:   "test config schema integration",
			schema: "config",
			golden: "config-schema.golden",
		},
		{
			name:   "test result schema integration",
			schema: "result",
			golden: "result-schema.golden",
		},
	}

	_, filename, _, _ := runtime.Caller(0)
	testDir := path.Dir(filename)
	rootDir := path.Join(testDir, "..", "..", "..")

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// change working directory to the root of the project
			// needed due to the AddGoComments function in the schema package
			err := os.Chdir(rootDir)
			if err != nil {
				t.Fatal(err)
			}
			var gotObj, wantObj map[string]interface{}
			tempDir := t.TempDir()
			schemaFile := filepath.Join(tempDir, tc.schema+"-schema.json")

			cmd := SchemaCommand()
			cmd.SetArgs([]string{
				tc.schema,
				"--output", schemaFile,
			})
			err = cmd.Execute()
			if err != nil {
				t.Fatal(err)
			}
			err = os.Chdir(testDir)
			if err != nil {
				t.Fatal(err)
			}

			assert.FileExists(t, schemaFile)
			got, err := os.ReadFile(schemaFile)
			if err != nil {
				t.Fatal(err)
			}
			want := helper.GoldenValue(t, tc.golden, got, *update)
			if err != nil {
				t.Fatal(err)
			}
			err = json.Unmarshal(got, &gotObj)
			if err != nil {
				t.Fatal(err)
			}
			err = json.Unmarshal(want, &wantObj)
			if err != nil {
				t.Fatal(err)
			}
			if !helper.MapsEqual(gotObj, wantObj, nil, "") {
				t.Fail()
				assert.Equal(t, string(want), string(got))
				t.Logf("golden file '%s' does not match the actual result", tc.golden)
			}
		})
	}
}
