package transformer

import (
	"os"
	"path/filepath"

	"github.com/B-S-F/yaku/onyx/pkg/configuration"
	"github.com/B-S-F/yaku/onyx/pkg/logger"
)

type configsLoader struct {
	rootWorkDir string
}

func NewConfigsLoader(rootWorkDir string) Transformer {
	return &configsLoader{
		rootWorkDir: rootWorkDir,
	}
}

func (d configsLoader) Transform(ep *configuration.ExecutionPlan) error {
	for index := range ep.Items {
		if ep.Items[index].Config != nil && ep.Items[index].Manual.Status == "" {
			for config := range ep.Items[index].Config {
				file, err := os.ReadFile(filepath.Join(d.rootWorkDir, config))
				if err != nil {
					logger.Get().UserErrorf("error reading config file '%s'. Trying to continue without it.", config)
					continue
				}
				ep.Items[index].Config[config] = string(file)
			}
		}
	}
	if ep.Finalize.Config != nil {
		for config := range ep.Finalize.Config {
			file, err := os.ReadFile(filepath.Join(d.rootWorkDir, config))
			if err != nil {
				logger.Get().UserErrorf("error reading config file '%s'. Trying to continue without it.", config)
				continue
			}
			ep.Finalize.Config[config] = string(file)
		}
	}
	return nil
}
