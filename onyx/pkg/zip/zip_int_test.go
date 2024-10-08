//go:build integration
// +build integration

package zip

import (
	"archive/zip"
	"fmt"
	"testing"

	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

func TestDirectoryIntegration(t *testing.T) {
	testCases := map[string]struct {
		path string
		want map[string][]byte
	}{
		"should zip a directory with files": {
			path: "testdata/dir/subdir",
			want: map[string][]byte{
				"file3.txt": []byte("file3"),
				"file4.txt": []byte("file4"),
			},
		},
		"should zip a directory with subdirectories and files": {
			path: "testdata/dir",
			want: map[string][]byte{
				"file1.txt":        []byte("file1"),
				"file2.txt":        []byte("file2"),
				"subdir/file3.txt": []byte("file3"),
				"subdir/file4.txt": []byte("file4"),
			},
		},
	}

	for name, tt := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			zipper := New(afero.NewOsFs())
			zipFilePath := fmt.Sprintf("%s.zip", tt.path)

			// act
			err := zipper.Directory(tt.path, zipFilePath)
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
			got := zipReader.File
			assert.Equal(t, len(tt.want), len(got))
			for path, contents := range tt.want {
				for _, file := range zipReader.File {
					if file.Name == path {
						assert.Equal(t, string(contents), readZipFile(t, file))
					}
				}
			}
		})
	}
}
