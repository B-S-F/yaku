//go:build unit
// +build unit

package workdir

import (
	"testing"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestCreateDir(t *testing.T) {
	fs := afero.NewMemMapFs()
	wdu := NewCreate(fs)
	t.Run("should create a directory", func(t *testing.T) {
		// arrange
		want := "path/to/dir"
		// act
		got, err := wdu.CreateDir("path", "to", "dir")

		// assert
		assert.Equal(t, want, got.String())
		exists, err := afero.DirExists(fs, want)
		assert.NoError(t, err)
		assert.True(t, exists)
	})

	t.Run("should return error if directory already exists", func(t *testing.T) {
		// act
		_, err := wdu.CreateDir("path", "to", "dir")
		_, err = wdu.CreateDir("path", "to", "dir") // call again with same path

		// assert
		assert.Error(t, err)
		assert.Errorf(t, err, "directory already exists")
	})
}

func TestCreateFile(t *testing.T) {
	// arrange
	fs := afero.NewMemMapFs()
	nopLogger := &logger.Log{
		Logger: zap.NewNop(),
	}
	wdu := &create{
		fs:     fs,
		logger: nopLogger,
	}
	path := "path/to/file.txt"

	// act
	err := wdu.CreateFile(path, []byte("file content"))

	// assert
	assert.NoError(t, err)
	exists, err := afero.Exists(fs, path)
	assert.NoError(t, err)
	assert.True(t, exists)

	content, err := afero.ReadFile(fs, path)
	assert.NoError(t, err)
	assert.Equal(t, "file content", string(content))
}
