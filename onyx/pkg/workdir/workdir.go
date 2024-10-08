package workdir

import (
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/spf13/afero"
)

type Utilizer interface {
	Creator
	Linker
	Copier
	Modifier
}
type utils struct {
	create
	copy
	link
	modify
}

func NewUtils(fs afero.Fs) Utilizer {
	logger := logger.Get()
	wd := utils{
		create: create{
			fs:     fs,
			logger: logger,
		},
		copy: copy{
			fs:     fs,
			logger: logger,
		},
		link: link{
			fs:     fs,
			logger: logger,
		},
		modify: modify{
			fs:     fs,
			logger: logger,
		},
	}
	return &wd
}
