package helper

import (
	"io"
	"os"
	"path/filepath"
	"testing"
)

func GoldenValue(t *testing.T, goldenFile string, actual []byte, update bool) []byte {
	t.Helper()
	goldenPath := filepath.Join("testdata", goldenFile)
	f, err := os.OpenFile(goldenPath, os.O_RDWR, 0644)
	if err != nil {
		t.Fatalf("error opening golden file '%s': %s ", goldenPath, err)
	}
	defer f.Close()
	if update {
		_ = f.Truncate(0)
		_, err = f.Write(actual)
		if err != nil {
			t.Fatalf("error writing to golden file '%s': %s ", goldenPath, err)
		}
		t.Logf("updated golden file '%s'", goldenPath)
		return actual
	}

	content, err := io.ReadAll(f)
	if err != nil {
		t.Fatalf("error reading golden file '%s': %s ", goldenPath, err)
	}
	return content
}
