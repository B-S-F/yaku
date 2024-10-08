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

func TestCopyFolder(t *testing.T) {
	fs := afero.NewOsFs()
	cp := NewCopy(fs)

	testCases := map[string]struct {
		files   []string
		exclude []string
		want    []string
	}{
		"should handle an empty directory": {
			files: []string{},
			want:  []string{},
		},
		"should copy a directory with files": {
			files: []string{
				"file1.txt",
				"file2.txt",
			},
			want: []string{
				"file1.txt",
				"file2.txt",
			},
		},
		"should not copy subdirectories and files inside it": {
			files: []string{
				"file1.txt",
				"file2.txt",
				"subdir/file3.txt",
				"subdir/file4.txt",
			},
			want: []string{
				"file1.txt",
				"file2.txt",
			},
		},
		"should not copy .secrets file": {
			files: []string{
				"file1.txt",
				".secrets",
			},
			exclude: []string{
				".secrets",
			},
			want: []string{
				"file1.txt",
			},
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			destDir := t.TempDir()
			for _, file := range tc.want {
				path := filepath.Join(tmpDir, file)
				if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(path, nil, 0644); err != nil {
					t.Fatal(err)
				}
			}

			// act
			err := cp.CopyFilesInFolder(tmpDir, destDir, tc.exclude)

			// assert
			assert.NoError(t, err)
			destFiles, err := afero.ReadDir(fs, destDir)
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, len(tc.want), len(destFiles))
		})
	}
}

func TestFilterFiles(t *testing.T) {
	t.Run("should filter .secrets file", func(t *testing.T) {
		// assert
		files := []*pathlib.Path{
			pathlib.NewPath("/path/to/.secrets"),
			pathlib.NewPath("/path/to/.secrets.local"),
			pathlib.NewPath("/path/to/file1.txt"),
			pathlib.NewPath("/path/to/file2.txt"),
		}

		// act
		filteredFiles := filterFiles(files, []string{".secrets"})

		// assert
		assert.Equal(t, 2, len(filteredFiles))
		assert.Equal(t, "/path/to/file1.txt", filteredFiles[0].String())
		assert.Equal(t, "/path/to/file2.txt", filteredFiles[1].String())
	})
}

type file struct {
	name    string
	content []byte
}

func TestCopyFile(t *testing.T) {
	fs := afero.NewOsFs()
	testCases := map[string]struct {
		file    file
		dest    *pathlib.Path
		wantErr bool
	}{
		"should copy a file to a directory": {
			file: file{
				name:    "source.txt",
				content: []byte("source"),
			},
			dest:    pathlib.NewPathAfero(t.TempDir(), fs),
			wantErr: false,
		},
		"should copy a file to a file": {
			file: file{
				name:    "source.txt",
				content: []byte("source"),
			},
			dest:    pathlib.NewPathAfero(filepath.Join(t.TempDir(), "dest.txt"), fs),
			wantErr: false,
		},
		"should return error if source file does not exist": {
			file:    file{},
			dest:    pathlib.NewPathAfero(t.TempDir(), fs),
			wantErr: true,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			srcPath := pathlib.NewPathAfero(filepath.Join(tmpDir, "some_file.txt"), fs)
			if tc.file.name != "" {
				sourceFile := filepath.Join(tmpDir, tc.file.name)
				err := os.WriteFile(sourceFile, tc.file.content, 0644)
				if err != nil {
					t.Fatal(err)
				}
				srcPath = pathlib.NewPathAfero(sourceFile, fs)
			}

			// act
			err := copyFile(srcPath, tc.dest)

			// assert
			if tc.wantErr {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			wantFile := tc.dest.String()
			if isDir, _ := tc.dest.IsDir(); isDir {
				wantFile = tc.dest.Join(tc.file.name).String()
			}
			content, err := afero.ReadFile(fs, wantFile)
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, string(tc.file.content), string(content))
		})
	}
}

func TestCopyFiles(t *testing.T) {
	fs := afero.NewOsFs()
	testCases := map[string]struct {
		files      []file
		inputPaths []string
		wantFiles  []string
		wantErr    bool
	}{
		"should copy files to a directory": {
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
			inputPaths: []string{
				"file1.txt",
				"file2.txt",
			},
			wantFiles: []string{
				"file1.txt",
				"file2.txt",
			},
			wantErr: false,
		},
		"should not copy directories": {
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
			inputPaths: []string{
				"file1.txt",
				"file2.txt",
				"subdir",
			},
			wantFiles: []string{
				"file1.txt",
				"file2.txt",
			},
			wantErr: false,
		},
		"should return error if a file does not exist": {
			files: []file{},
			inputPaths: []string{
				"file1.txt",
			},
			wantFiles: []string{},
			wantErr:   true,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// arrange
			tmpDir := t.TempDir()
			for _, file := range tc.files {
				sourceFile := filepath.Join(tmpDir, file.name)
				pathlib.NewPathAfero(sourceFile, fs).Parent().MkdirAll()
				err := os.WriteFile(sourceFile, file.content, 0644)
				if err != nil {
					t.Fatal(err)
				}
			}
			filePaths := []*pathlib.Path{}
			for _, path := range tc.inputPaths {
				filePaths = append(filePaths, pathlib.NewPathAfero(filepath.Join(tmpDir, path), fs))
			}
			destDir := t.TempDir()

			// act
			err := copyFiles(filePaths, pathlib.NewPathAfero(destDir, fs), fs)

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
		})
	}
}
