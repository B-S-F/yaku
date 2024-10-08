package reader

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/pkg/errors"
)

type FileReader interface {
	Read(name string) ([]byte, error)
	ReadJsonMap(name string) (map[string]string, error)
}

type readFile func(name string) ([]byte, error)

type fileReader struct {
	logger logger.Logger
	reader readFile
}

func New() FileReader {
	return &fileReader{
		logger: logger.Get(),
		reader: os.ReadFile,
	}
}

func (h *fileReader) Read(name string) ([]byte, error) {
	h.logger.Infof("reading file '%s'", filepath.Base(name))
	content, err := h.reader(name)
	if err != nil {
		return nil, errors.Wrapf(err, "error reading file '%s'", name)
	}
	return content, nil
}

func (h *fileReader) ReadJsonMap(name string) (map[string]string, error) {
	content, err := h.Read(name)
	if err != nil {
		return nil, err
	}
	m := make(map[string]string)
	if len(content) > 0 {
		if err := json.Unmarshal(content, &m); err != nil {
			return nil, errors.Wrapf(err, "could not parse json data")
		}
	}
	return m, nil
}
