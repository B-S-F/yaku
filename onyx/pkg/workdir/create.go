package workdir

import (
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/chigopher/pathlib"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
	"go.uber.org/zap"
)

type Creator interface {
	CreateDir(elems ...string) (*pathlib.Path, error)
	CreateFile(file string, content []byte) error
}

type create struct {
	fs     afero.Fs
	logger logger.Logger
}

func NewCreate(fs afero.Fs) *create {
	return &create{
		fs:     fs,
		logger: logger.Get(),
	}
}

func (wdu *create) CreateDir(elems ...string) (*pathlib.Path, error) {
	path := pathlib.NewPath(filepath.Join(elems...), pathlib.PathWithAfero(wdu.fs))
	wdu.logger.Debug("Creating workdir", zap.String("path", path.String()))
	if exists, _ := path.Exists(); exists {
		return nil, errors.New("directory already exists")
	}
	return path, path.MkdirAll()
}

func (wdu *create) CreateFile(file string, content []byte) error {
	filePath := pathlib.NewPath(file, pathlib.PathWithAfero(wdu.fs))
	return filePath.WriteFile(content)
}
