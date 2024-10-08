//go:build unit
// +build unit

package workdir

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/chigopher/pathlib"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

func TestLinkFiles(t *testing.T) {
	fs := afero.NewOsFs()
	wdu := NewLink(fs)
	testCases := map[string]struct {
		files     []file
		inputPath string
		wantFiles []string
		wantErr   bool
	}{
		"should link files to a directory": {
			files: []file{
				{
					name:    "file1.txt",
					content: []byte("file1"),
				},
				{
					name:    "file2.txt",
					content: []byte("file2"),
				},
			},
			inputPath: t.TempDir(),
			wantFiles: []string{
				"file1.txt",
				"file2.txt",
			},
			wantErr: false,
		},
		"should not link directories": {
			files: []file{
				{
					name:    "file1.txt",
					content: []byte("file1"),
				},
				{
					name:    "file2.txt",
					content: []byte("file2"),
				},
				{
					name:    "subdir/file3.txt",
					content: []byte("file3"),
				},
				{
					name:    "subdir/file4.txt",
					content: []byte("file4"),
				},
			},
			inputPath: t.TempDir(),
			wantFiles: []string{
				"file1.txt",
				"file2.txt",
			},
			wantErr: false,
		},
		"should return error if the folder does not exist": {
			files:     []file{},
			inputPath: "some/path",
			wantFiles: []string{},
			wantErr:   true,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			for _, file := range tc.files {
				sourceFile := filepath.Join(tc.inputPath, file.name)
				pathlib.NewPathAfero(sourceFile, fs).Parent().MkdirAll()
				err := os.WriteFile(sourceFile, file.content, 0644)
				if err != nil {
					t.Fatal(err)
				}
			}
			destDir := t.TempDir()

			// act
			err := wdu.LinkFiles(tc.inputPath, destDir)

			// assert
			if tc.wantErr {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			destFiles, err := afero.ReadDir(fs, destDir)
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, len(tc.wantFiles), len(destFiles))
			for _, fileInfo := range destFiles {
				assert.Contains(t, tc.wantFiles, fileInfo.Name())
				assert.True(t, fileInfo.Mode()&os.ModeSymlink == os.ModeSymlink)
			}
		})
	}
}

func TestRemoveLinkedFiles(t *testing.T) {
	fs := afero.NewOsFs()
	wdu := NewLink(fs)
	testCases := map[string]struct {
		linkFiles []file
		copyFiles []file
		inputPath string
	}{
		"should remove linked files from a directory": {
			linkFiles: []file{
				{
					name:    "file1.txt",
					content: []byte("file1"),
				},
				{
					name:    "file2.txt",
					content: []byte("file2"),
				},
			},
			copyFiles: []file{},
			inputPath: t.TempDir(),
		},
		"should skip non-linked files": {
			linkFiles: []file{
				{
					name:    "file1.txt",
					content: []byte("file1"),
				},
				{
					name:    "file2.txt",
					content: []byte("file2"),
				},
			},
			copyFiles: []file{
				{
					name:    "file3.txt",
					content: []byte("file3"),
				},
			},
			inputPath: t.TempDir(),
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			destDir := t.TempDir()
			for _, file := range tc.linkFiles {
				sourceFile := filepath.Join(tc.inputPath, file.name)
				pathlib.NewPathAfero(sourceFile, fs).Parent().MkdirAll()
				err := os.WriteFile(sourceFile, file.content, 0644)
				if err != nil {
					t.Fatal(err)
				}
			}
			err := wdu.LinkFiles(tc.inputPath, destDir)
			if err != nil {
				t.Fatal(err)
			}
			for _, file := range tc.copyFiles {
				path := filepath.Join(destDir, file.name)
				pathlib.NewPathAfero(path, fs).Parent().MkdirAll()
				err := os.WriteFile(path, file.content, 0644)
				if err != nil {
					t.Fatal(err)
				}
			}

			// act
			wdu.RemoveLinkedFiles(destDir)

			// assert
			for _, file := range tc.copyFiles {
				path := pathlib.NewPath(filepath.Join(destDir, file.name))
				exists, _ := path.Exists()
				assert.True(t, exists)
				fileInfo, _ := fs.Stat(path.String())
				assert.True(t, fileInfo.Mode().IsRegular())
			}
			for _, file := range tc.linkFiles {
				path := pathlib.NewPath(filepath.Join(destDir, file.name))
				exists, _ := path.Exists()
				assert.False(t, exists)
			}
		})
	}
}
