package workdir

import (
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
	"go.uber.org/zap"
)

type Linker interface {
	LinkFiles(source, dest string) error
	RemoveLinkedFiles(directory string)
}

type link struct {
	fs     afero.Fs
	logger logger.Logger
}

func NewLink(fs afero.Fs) *link {
	return &link{
		fs:     fs,
		logger: logger.Get(),
	}
}

func (wdu *link) LinkFiles(source, dest string) error {
	sourceFiles, err := afero.ReadDir(wdu.fs, source)
	if err != nil {
		return errors.Wrap(err, "failed to read source files")
	}
	for _, file := range sourceFiles {
		if !file.IsDir() {
			oldFile := filepath.Join(source, file.Name())
			newFile := filepath.Join(dest, file.Name())
			if _, err := wdu.fs.Stat(newFile); err == nil {
				wdu.logger.Debug("file already exists", zap.String("file", newFile))
				continue
			}
			if err := os.Symlink(oldFile, newFile); err != nil {
				return errors.Wrap(err, "failed to create symlink")
			}
		}
	}
	return nil
}

func (wdu *link) RemoveLinkedFiles(directory string) {
	files, err := afero.ReadDir(wdu.fs, directory)
	if err != nil {
		wdu.logger.Error("failed to read directory", zap.String("directory", directory), zap.Error(err))
		return
	}
	for _, file := range files {
		if !file.IsDir() {
			filePath := filepath.Join(directory, file.Name())
			isSymlink, err := isSymlink(filePath)
			if err != nil {
				wdu.logger.Error("failed to check if file is symlink", zap.String("filePath", filepath.Join(directory, file.Name())), zap.Error(err))
				continue
			}
			if isSymlink {
				err := wdu.fs.Remove(filePath)
				if err != nil {
					wdu.logger.Error("failed to remove symlink", zap.String("filePath", filePath), zap.Error(err))
					continue
				}
			}
		}
	}
}

func isSymlink(filePath string) (bool, error) {
	fileInfo, err := os.Lstat(filePath)
	if err != nil {
		return false, err
	}
	return fileInfo.Mode()&os.ModeSymlink == os.ModeSymlink, nil
}
