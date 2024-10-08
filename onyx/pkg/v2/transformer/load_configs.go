package transformer

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
)

type configsLoader struct {
	rootWorkDir string
}

func NewConfigsLoader(rootWorkDir string) Transformer {
	return &configsLoader{
		rootWorkDir: rootWorkDir,
	}
}

func (d configsLoader) Transform(ep *model.ExecutionPlan) error {
	for index := range ep.AutopilotChecks {
		autopilotItem := &ep.AutopilotChecks[index]
		for _, stepLevels := range autopilotItem.Autopilot.Steps {
			for _, step := range stepLevels {
				if step.Configs != nil {
					for config := range step.Configs {
						file, err := os.ReadFile(filepath.Join(d.rootWorkDir, config))
						if err != nil {
							logger.Get().Warn(fmt.Sprintf("error reading config file '%s'. Trying to continue without it.", config))
							continue
						}
						step.Configs[config] = string(file)
					}
				}
			}
		}
		for config := range autopilotItem.Autopilot.Evaluate.Configs {
			file, err := os.ReadFile(filepath.Join(d.rootWorkDir, config))
			if err != nil {
				logger.Get().Warn(fmt.Sprintf("error reading config file '%s'. Trying to continue without it.", config))
				continue
			}
			autopilotItem.Autopilot.Evaluate.Configs[config] = string(file)
		}
	}
	if ep.Finalize != nil {
		if ep.Finalize.Configs != nil {
			for config := range ep.Finalize.Configs {
				file, err := os.ReadFile(filepath.Join(d.rootWorkDir, config))
				if err != nil {
					logger.Get().Warn(fmt.Sprintf("error reading config file '%s'. Trying to continue without it.", config))
					continue
				}
				ep.Finalize.Configs[config] = string(file)
			}
		}
	}
	return nil
}
