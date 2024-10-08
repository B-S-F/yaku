package workdir

import (
	"strings"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/chigopher/pathlib"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
)

type Copier interface {
	CopyFilesInFolder(sourcePath, destPath string, exclude []string) error
}

type copy struct {
	fs     afero.Fs
	logger logger.Logger
}

func NewCopy(fs afero.Fs) *copy {
	return &copy{
		fs:     fs,
		logger: logger.Get(),
	}
}

func (cp *copy) CopyFilesInFolder(sourceFolder, destFolder string, exclude []string) error {
	sourcePath := pathlib.NewPath(sourceFolder, pathlib.PathWithAfero(cp.fs))
	destPath := pathlib.NewPath(destFolder, pathlib.PathWithAfero(cp.fs))
	inputFiles, err := sourcePath.ReadDir()
	if err != nil {
		return err
	}
	filesToCopy := filterFiles(inputFiles, exclude)
	err = copyFiles(filesToCopy, destPath, cp.fs)
	if err != nil {
		return err
	}
	return nil
}
func filterFiles(files []*pathlib.Path, exclude []string) []*pathlib.Path {
	var filteredFiles []*pathlib.Path
	for _, file := range files {
		excluded := false
		for _, excludedFile := range exclude {
			if strings.HasPrefix(file.Name(), excludedFile) {
				excluded = true
				break
			}
		}
		if !excluded {
			filteredFiles = append(filteredFiles, file)
		}
	}
	return filteredFiles
}

func copyFile(src *pathlib.Path, dest *pathlib.Path) error {
	isDir, _ := dest.IsDir()
	if isDir {
		dest = dest.Join(src.Name())
	}
	srcContent, err := src.ReadFile()
	if err != nil {
		return err
	}
	err = dest.WriteFile(srcContent)
	return err
}

func copyFiles(filePaths []*pathlib.Path, destPath *pathlib.Path, fs afero.Fs) error {
	for _, file := range filePaths {
		if exists, _ := file.Exists(); !exists {
			return errors.Errorf("file %s does not exist", file)
		}
		if isFile, _ := file.IsFile(); isFile {
			err := copyFile(file, destPath)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
