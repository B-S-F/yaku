package zip

import (
	"archive/zip"
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/spf13/afero"
	"go.uber.org/zap"
)

type Zip struct {
	fs     afero.Fs
	logger logger.Logger
}

func New(fs afero.Fs) Zip {
	return Zip{
		fs:     fs,
		logger: logger.Get(),
	}
}

func parentDir(path string) string {
	path = filepath.Clean(path)
	dir, _ := filepath.Split(path)
	return dir
}

func (z *Zip) Directory(path, output string) error {
	z.logger.Debug("zipping", zap.String("path", path), zap.String("output", output))
	zipFile, err := z.fs.Create(output)
	if err != nil {
		return err
	}
	defer zipFile.Close()
	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()
	dir := parentDir(path)
	z.logger.Debug("dir to remove from path", zap.String("dir", dir))
	walk := newWalk(zipWriter, path)
	err = afero.Walk(z.fs, path, walk.Function)
	if err != nil {
		return err
	}
	return nil
}

type walk struct {
	basepath string
	writer   *zip.Writer
	logger   logger.Logger
}

func newWalk(w *zip.Writer, basepath string) walk {
	return walk{
		writer:   w,
		basepath: basepath,
		logger:   logger.Get(),
	}
}

func (w *walk) Function(path string, info os.FileInfo, err error) error {
	if err != nil {
		return err
	}
	w.logger.Debug("walking", zap.String("path", path))
	relPath, err := filepath.Rel(w.basepath, path)
	w.logger.Debug("resolved path", zap.String("path", path), zap.String("relPath", relPath))
	if err != nil {
		return err
	}
	if info.IsDir() {
		w.logger.Debug("skipping directory", zap.String("path", path))
		return nil
	}
	fileContent, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	zipFileHeader, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}
	zipFileHeader.Name = relPath
	zipFileWriter, err := w.writer.CreateHeader(zipFileHeader)
	if err != nil {
		return err
	}
	_, err = zipFileWriter.Write(fileContent)
	if err != nil {
		return err
	}
	return nil
}
