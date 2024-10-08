package zip

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
	"testing"
)

func readZipFile(t *testing.T, zipFile *zip.File) string {
	fileReader, err := zipFile.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer fileReader.Close()
	fileContents, err := io.ReadAll(fileReader)
	if err != nil {
		t.Fatal(err)
	}
	return string(fileContents)
}

func createTestFolder(t *testing.T, structure map[string][]byte) string {
	tmpDir := t.TempDir()
	for path, contents := range structure {
		fullPath := filepath.Join(tmpDir, path)
		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(fullPath, contents, 0644); err != nil {
			t.Fatal(err)
		}
	}
	return tmpDir
}
