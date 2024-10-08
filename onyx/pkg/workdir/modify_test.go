package workdir

import (
	"os"
	"testing"

	"github.com/chigopher/pathlib"
	"github.com/spf13/afero"
	"github.com/stretchr/testify/assert"
)

type fileParam struct {
	path string
	mode os.FileMode
}

func TestUpdatePermissionOfFiles(t *testing.T) {
	params := []struct {
		name         string
		initialFiles []fileParam
		updatedFiles []string
		newMode      os.FileMode
		expectedErr  error
	}{
		{
			name: "single file",
			initialFiles: []fileParam{
				{
					path: "path/to/file.txt",
					mode: 0644,
				},
			},
			updatedFiles: []string{
				"path/to/file.txt",
			},
			newMode: 0777,
		},
		{
			name: "multiple files",
			initialFiles: []fileParam{
				{
					path: "path/to/file1.txt",
					mode: 0644,
				},
				{
					path: "path/to/file2.txt",
					mode: 0644,
				},
			},
			updatedFiles: []string{
				"path/to/file1.txt",
				"path/to/file2.txt",
			},
			newMode: 0777,
		},
	}

	for _, param := range params {
		t.Run(param.name, func(t *testing.T) {
			// arrange
			fs := afero.NewMemMapFs()
			wdu := NewModify(fs)

			filePaths := []*pathlib.Path{}
			for _, file := range param.initialFiles {
				path := pathlib.NewPath(file.path, pathlib.PathWithAfero(fs))
				path.WriteFileMode([]byte("file content"), file.mode)
				filePaths = append(filePaths, path)
			}

			// act
			err := wdu.UpdatePermissions(param.newMode, filePaths)

			// assert
			assert.NoError(t, err)
			for _, path := range param.updatedFiles {
				fileInfo, err := afero.Fs.Stat(fs, path)
				assert.NoError(t, err)
				assert.EqualValues(t, param.newMode, fileInfo.Mode())
			}
		})
	}
}

func TestUpdatePermissionOfFilesFailure(t *testing.T) {
	// arrange
	fs := afero.NewMemMapFs()
	wdu := NewModify(fs)
	filePaths := []*pathlib.Path{
		pathlib.NewPath("path/to/file.txt", pathlib.PathWithAfero(fs)),
	}

	// act
	err := wdu.UpdatePermissions(0777, filePaths)

	// assert
	assert.Error(t, err)
}

func TestUpdatePermissionsForFilesInFolder(t *testing.T) {
	// arrange
	fs := afero.NewMemMapFs()
	wdu := NewModify(fs)
	rootPath := pathlib.NewPath("path/to/folder", pathlib.PathWithAfero(fs))
	rootPath.MkdirAll()
	path1 := rootPath.Join("file1.txt")
	path2 := rootPath.Join("file2.txt")
	err := path1.WriteFileMode([]byte("file content"), 0644)
	assert.NoError(t, err)
	err = path2.WriteFileMode([]byte("file content"), 0644)
	assert.NoError(t, err)

	// act
	err = wdu.UpdatePermissionsForFilesInFolder(0777, rootPath)

	// assert
	assert.NoError(t, err)
	fileInfo, err := path1.Stat()
	assert.NoError(t, err)
	assert.EqualValues(t, 0777, fileInfo.Mode())
	fileInfo, err = path2.Stat()
	assert.NoError(t, err)
	assert.EqualValues(t, 0777, fileInfo.Mode())
}

func TestUpdateContent(t *testing.T) {
	// arrange
	fs := afero.NewMemMapFs()
	wdu := NewModify(fs)

	// act
	err := wdu.UpdateContent("path/to/file1.txt", []byte("file1"))

	// assert
	assert.NoError(t, err)
	fileContent, err := afero.ReadFile(fs, "path/to/file1.txt")
	assert.NoError(t, err)
	assert.EqualValues(t, "file1", fileContent)
}

func TestUpdateContentForce(t *testing.T) {
	// arrange
	fs := afero.NewMemMapFs()
	wdu := NewModify(fs)
	wdu.fs.Create("path/to/file1.txt")
	wdu.fs.Chmod("path/to/file1.txt", 0444)

	// act
	err := wdu.UpdateContentForce("path/to/file1.txt", []byte("file1"))

	// assert
	assert.NoError(t, err)
	fileContent, err := afero.ReadFile(fs, "path/to/file1.txt")
	assert.NoError(t, err)
	assert.EqualValues(t, "file1", fileContent)
}
