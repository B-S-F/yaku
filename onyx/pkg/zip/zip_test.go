//go:build unit
// +build unit

package zip

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var nopLogger = &logger.Log{
	Logger: zap.NewNop(),
}

func TestDirectory(t *testing.T) {
	testCases := map[string]struct {
		createDir bool
		want      map[string][]byte
		wantErr   bool
	}{
		"should zip a directory with files": {
			createDir: true,
			want: map[string][]byte{
				"file3.txt": []byte("file3"),
				"file4.txt": []byte("file4"),
			},
			wantErr: false,
		},
		"should zip a directory with subdirectories and files": {
			createDir: true,
			want: map[string][]byte{
				"file1.txt":        []byte("file1"),
				"file2.txt":        []byte("file2"),
				"subdir/file3.txt": []byte("file3"),
				"subdir/file4.txt": []byte("file4"),
			},
			wantErr: false,
		},
		"should return error if directory does not exist": {
			createDir: false,
			want:      map[string][]byte{},
			wantErr:   true,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			var tmpDir string
			if tc.createDir {
				tmpDir = createTestFolder(t, tc.want)
			}
			zipper := &Zip{
				fs:     afero.NewOsFs(),
				logger: nopLogger,
			}
			zipFilePath := "test.zip"

			// act
			err := zipper.Directory(tmpDir, zipFilePath)
			defer zipper.fs.Remove(zipFilePath)

			// assert
			if tc.wantErr {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			zipFile, err := zipper.fs.Open(zipFilePath)
			defer zipFile.Close()
			fi, err := zipFile.Stat()
			zipReader, err := zip.NewReader(zipFile, fi.Size())
			if err != nil {
				t.Fatalf("failed to read zip file: %v", err)
			}
			got := zipReader.File
			assert.Equal(t, len(tc.want), len(got))
			for path, contents := range tc.want {
				for _, file := range zipReader.File {
					if file.Name == path {
						assert.Equal(t, string(contents), readZipFile(t, file))
					}
				}
			}
		})
		t.Run("should zip a file and preserve it's proper modification time", func(t *testing.T) {
			// arrange
			tmpDir := createTestFolder(t, map[string][]byte{
				"file1.txt": []byte("file1"),
			})
			zipper := &Zip{
				fs:     afero.NewOsFs(),
				logger: nopLogger,
			}
			zipFilePath := "test.zip"

			// act
			err := zipper.Directory(tmpDir, zipFilePath)
			defer zipper.fs.Remove(zipFilePath)

			// assert
			assert.NoError(t, err)
			zipFile, err := zipper.fs.Open(zipFilePath)
			defer zipFile.Close()
			fi, err := zipFile.Stat()
			zipReader, err := zip.NewReader(zipFile, fi.Size())
			if err != nil {
				t.Fatalf("failed to read zip file: %v", err)
			}
			for _, file := range zipReader.File {
				assert.WithinDuration(t, time.Now(), file.Modified, 1*time.Hour)
			}
		})
	}
}

func TestParentDir(t *testing.T) {
	testCases := map[string]struct {
		path string
		want string
	}{
		"should return empty path": {
			path: "",
			want: "",
		},
		"shoule return root path": {
			path: "/",
			want: "/",
		},
		"should return directory path of absolute file path": {
			path: "/path/to/file.txt",
			want: "/path/to/",
		},
		"should return parent folder for directory path": {
			path: "/path/to/directory/",
			want: "/path/to/",
		},
		"should return directory path of relative file path": {
			path: "path/to/file.txt",
			want: "path/to/",
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// act
			got := parentDir(tc.path)
			// assert
			assert.Equal(t, tc.want, got)
		})
	}
}

func TestWalkFunction(t *testing.T) {
	testCases := map[string]struct {
		want map[string][]byte
	}{
		"should create zip file with single file": {
			want: map[string][]byte{
				"file.txt": []byte("file"),
			},
		},
		"should create zip file with complex directory": {
			want: map[string][]byte{
				"file1.txt":        []byte("file1"),
				"file2.txt":        []byte("file2"),
				"subdir/file3.txt": []byte("file3"),
				"subdir/file4.txt": []byte("file4"),
			},
		},
		"should create zip file with empty file": {
			want: map[string][]byte{
				"file.txt": []byte(""),
			},
		},
		"should create zip file with empty folder": {
			want: map[string][]byte{},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			zipDir := createTestFolder(t, tc.want)
			tmpDir := t.TempDir()
			zipFile, err := os.Create(filepath.Join(tmpDir, "test.zip"))
			defer os.Remove(zipFile.Name())
			if err != nil {
				t.Fatal(err)
			}
			zipWriter := zip.NewWriter(zipFile)

			// act
			walkFunc := newWalk(zipWriter, zipDir)
			err = filepath.Walk(zipDir, walkFunc.Function)
			zipWriter.Close()

			// assert
			zipFileContents, err := os.ReadFile(zipFile.Name())
			if err != nil {
				t.Fatal(err)
			}
			zipReader, err := zip.NewReader(bytes.NewReader(zipFileContents), int64(len(zipFileContents)))
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, len(tc.want), len(zipReader.File))
			for path, contents := range tc.want {
				for _, file := range zipReader.File {
					if file.Name == path {
						assert.Equal(t, string(contents), readZipFile(t, file))
					}
				}
			}
		})
	}
}
