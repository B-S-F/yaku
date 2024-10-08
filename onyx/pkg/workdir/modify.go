package workdir

import (
	"os"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/chigopher/pathlib"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
)

type Modifier interface {
	UpdatePermissions(mode os.FileMode, files []*pathlib.Path) error
	UpdatePermissionsForFilesInFolder(mode os.FileMode, folder *pathlib.Path) error
	UpdateContent(file string, content []byte) error
	UpdateContentForce(file string, content []byte) error
}

type modify struct {
	fs     afero.Fs
	logger logger.Logger
}

func NewModify(fs afero.Fs) *modify {
	return &modify{
		fs:     fs,
		logger: logger.Get(),
	}
}

func (wdu *modify) UpdatePermissions(mode os.FileMode, files []*pathlib.Path) error {
	for _, file := range files {
		err := wdu.fs.Chmod(file.String(), mode)
		if err != nil {
			return errors.Wrapf(err, "failed to update permissions for file %s", file)
		}
	}
	return nil
}

func (wdu *modify) UpdatePermissionsForFilesInFolder(mode os.FileMode, folder *pathlib.Path) error {
	fileInfos, err := folder.ReadDir()
	if err != nil {
		return err
	}
	filePaths := []*pathlib.Path{}
	for _, file := range fileInfos {
		ok, _ := file.IsFile()
		if ok {
			filePaths = append(filePaths, file)
		}
	}
	err = wdu.UpdatePermissions(mode, filePaths)
	if err != nil {
		return errors.Wrapf(err, "failed to update permissions for files in folder %s", folder)
	}
	return nil
}

func (wdu *modify) UpdateContent(file string, content []byte) error {
	filePath := pathlib.NewPath(file, pathlib.PathWithAfero(wdu.fs))
	err := filePath.WriteFile(content)
	if err != nil {
		return errors.Wrapf(err, "failed to update contents for file %s", file)
	}
	return nil
}

// UpdateContentsForce updates the contents of the files in the workdir. If the update fails it will try to remove the file and write it again.
func (wdu *modify) UpdateContentForce(file string, content []byte) error {
	err := wdu.UpdateContent(file, content)
	if err != nil {
		wdu.logger.Debugf("Failed to update file %s, trying to remove and write again", file)
		err = wdu.fs.Remove(file)
		if err != nil {
			return errors.Wrapf(err, "failed to remove file %s", file)
		}
		err = wdu.UpdateContent(file, content)
		if err != nil {
			return errors.Wrapf(err, "failed to update contents for file %s", file)
		}
	}
	return nil
}
