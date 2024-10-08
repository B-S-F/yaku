//go:build integration
// +build integration

package workdir

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/chigopher/pathlib"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

func TestWorkdirIntegration(t *testing.T) {
	fs := afero.NewOsFs()
	wdu := NewUtils(fs)

	t.Run("should create a directory", func(t *testing.T) {
		tmpDir := t.TempDir()
		// arrange
		want := filepath.Join(tmpDir, "path/to/dir")
		// act
		got, err := wdu.CreateDir(tmpDir, "path", "to", "dir")

		// assert
		assert.NoError(t, err)
		assert.Equal(t, want, got.String())
		exists, err := afero.DirExists(fs, want)
		if err != nil {
			t.Fatal(err)
		}
		assert.True(t, exists)
	})

	t.Run("should copy files in a directory", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		want := []string{
			"file1.txt",
			"file2.txt",
		}
		// act
		err := wdu.CopyFilesInFolder("testdata", tmpDir, []string{".secrets"})

		// assert
		assert.NoError(t, err)
		destFiles, err := afero.ReadDir(fs, tmpDir)
		if err != nil {
			t.Fatal(err)
		}
		assert.Equal(t, len(want), len(destFiles))
		for _, fileInfo := range destFiles {
			assert.Contains(t, want, fileInfo.Name())
			assert.True(t, fileInfo.Mode().IsRegular())
		}
	})

	t.Run("should link files in a directory", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		want := []string{
			"file1.txt",
			"file2.txt",
			".secrets",
		}
		// act
		err := wdu.LinkFiles("testdata", tmpDir)

		// assert
		destFiles, err := afero.ReadDir(fs, tmpDir)
		if err != nil {
			t.Fatal(err)
		}
		assert.Equal(t, len(want), len(destFiles))
		for _, fileInfo := range destFiles {
			assert.Contains(t, want, fileInfo.Name())
			assert.True(t, fileInfo.Mode()&os.ModeSymlink == os.ModeSymlink)
		}
	})

	t.Run("should modify permissions of files in a directory", func(t *testing.T) {
		// arrange
		tmpDir := pathlib.NewPath(t.TempDir(), pathlib.PathWithAfero(fs))
		tmpDir.MkdirAll()
		file1 := tmpDir.Join("file1.txt")
		file2 := tmpDir.Join("file2.txt")
		err := file1.WriteFileMode([]byte("file1"), 0777)
		if err != nil {
			t.Fatal(err)
		}
		err = file2.WriteFileMode([]byte("file2"), 0777)
		if err != nil {
			t.Fatal(err)
		}

		// act
		err = wdu.UpdatePermissionsForFilesInFolder(0444, tmpDir)

		// assert
		assert.NoError(t, err)
		paths, err := tmpDir.ReadDir()
		if err != nil {
			t.Fatal(err)
		}
		for _, path := range paths {
			stats, err := path.Stat()
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, os.FileMode(0444), stats.Mode())
		}
	})

	t.Run("should remove linked files in a directory", func(t *testing.T) {
		// arrange
		tmpDir := t.TempDir()
		err := wdu.LinkFiles("testdata", tmpDir)

		// act
		wdu.RemoveLinkedFiles(tmpDir)

		// assert
		assert.NoError(t, err)
		destFiles, err := afero.ReadDir(fs, tmpDir)
		if err != nil {
			t.Fatal(err)
		}
		assert.Equal(t, 0, len(destFiles))
	})
}
