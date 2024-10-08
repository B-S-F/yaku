//go:build integration
// +build integration

package exec

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"testing"
	"time"

	"github.com/B-S-F/onyx/internal/onyx/exec"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/stretchr/testify/assert"
)

var (
	update = flag.Bool("update", false, "update the golden files of this test")
)

const (
	// ignoring the temp directories, as they are different on each run
	ignoreTempDir = `((\/var\/folders\/.*?\/(exec|apps)\/)|(\/tmp\/.*?\/(exec|apps)\/)|(C:\\\\Temp\\\\.*?\\\\(exec|apps)\\\\))`
	// ignoring the bash line number, as it differs between different Bash versions
	ignoreBashLine = "(/bin/bash: line [0-9]+:)"
	// ignoring the date, as it is different on each run
	ignoreDate = `\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\+\d{2}:\d{2}|Z)|\s\d{2}:\d{2})`
)

func TestExecCommandIntegration(t *testing.T) {
	versions := []string{"v1", "v2"}
	appsPath := "testdata/apps"
	re := regexp.MustCompile(fmt.Sprintf("%s|%s|%s", ignoreTempDir, ignoreBashLine, ignoreDate))
	serveApps(appsPath, "8081", t)

	for _, version := range versions {
		configPath := "testdata/" + version + "/configuration"
		goldenPath := version + "/configuration/qg-result.golden"
		t.Run("test exec integration "+version, func(t *testing.T) {
			tempDir := t.TempDir()
			resultFile := filepath.Join(tempDir, "qg-result.yaml")
			evidenceZipFile := filepath.Join(tempDir, "evidence.zip")
			exec.OverrideDirectoriesForTest(tempDir + "/exec")

			cmd := ExecCommand()
			cmd.SetArgs([]string{
				configPath,
				"--output-dir", tempDir,
				"--check-timeout", "3",
			})
			startTime := time.Now()
			err := cmd.Execute()
			endTime := time.Now()
			diff := endTime.Sub(startTime)
			assert.NoError(t, err)
			assert.Less(t, diff.Seconds(), 10.0)

			assert.FileExists(t, resultFile)
			assert.FileExists(t, evidenceZipFile)
			got, err := os.ReadFile(resultFile)
			replacedGot := re.ReplaceAll(got, []byte{})
			if err != nil {
				t.Fatal(err)
			}
			want := helper.GoldenValue(t, goldenPath, replacedGot, *update)
			assert.YAMLEq(t, string(want), string(replacedGot))
		})
	}
}

func serveApps(directory string, port string, t *testing.T) {
	http.Handle("/", http.FileServer(http.Dir(directory)))
	go func() {
		err := http.ListenAndServe(":"+port, nil)
		if err != nil {
			t.Fail()
		}
	}()
}
