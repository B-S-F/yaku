//go:build integration
// +build integration

package migrate

import (
	"flag"
	"os"
	"path/filepath"
	"testing"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

func TestMigrateV0CommandIntegration(t *testing.T) {
	t.Run("test migrate integration", func(t *testing.T) {
		var gotObj, wantObj map[string]interface{}
		tempDir := t.TempDir()
		configFile := filepath.Join(tempDir, "qg-config.yaml")

		cmd := MigrateCommand()
		cmd.SetArgs([]string{
			"--target-version", "v1",
			"testdata/old-qg-config.yaml",
			"--output", configFile,
		})
		cmd.Execute()

		assert.FileExists(t, configFile)
		got, err := os.ReadFile(configFile)
		if err != nil {
			t.Fatal(err)
		}
		want := helper.GoldenValue(t, "v1-qg-config.golden", got, *update)
		if err != nil {
			t.Fatal(err)
		}
		err = yaml.Unmarshal(got, &gotObj)
		if err != nil {
			t.Fatal(err)
		}
		err = yaml.Unmarshal(want, &wantObj)
		if err != nil {
			t.Fatal(err)
		}
		if !helper.MapsEqual(gotObj, wantObj, nil, "") {
			t.Fail()
			assert.Equal(t, string(want), string(got))
			t.Logf("golden file %s does not match the actual result", "v1-qg-config.golden")
		}
	})
}

func TestMigrateV1CommandIntegration(t *testing.T) {
	t.Run("test migrate integration", func(t *testing.T) {
		var gotObj, wantObj map[string]interface{}
		tempDir := t.TempDir()
		configFile := filepath.Join(tempDir, "qg-config.yaml")

		cmd := MigrateCommand()
		cmd.SetArgs([]string{
			"--target-version", "v2",
			"testdata/v1-qg-config.yaml",
			"--output", configFile,
		})
		cmd.Execute()

		assert.FileExists(t, configFile)
		got, err := os.ReadFile(configFile)
		if err != nil {
			t.Fatal(err)
		}
		want := helper.GoldenValue(t, "v2-qg-config.golden", got, *update)
		if err != nil {
			t.Fatal(err)
		}
		err = yaml.Unmarshal(got, &gotObj)
		if err != nil {
			t.Fatal(err)
		}
		err = yaml.Unmarshal(want, &wantObj)
		if err != nil {
			t.Fatal(err)
		}
		if !helper.MapsEqual(gotObj, wantObj, nil, "") {
			t.Fail()
			assert.Equal(t, string(want), string(got))
			t.Logf("golden file %s does not match the actual result", "v2-qg-config.golden")
		}
	})

}
