package exec

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/B-S-F/onyx/internal/onyx/common"
	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/finalize"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/item"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/reader"
	"github.com/B-S-F/onyx/pkg/replacer"
	"github.com/B-S-F/onyx/pkg/repository"
	"github.com/B-S-F/onyx/pkg/repository/app"
	"github.com/B-S-F/onyx/pkg/repository/registry"
	"github.com/B-S-F/onyx/pkg/result"
	v1Result "github.com/B-S-F/onyx/pkg/result/v1"
	"github.com/B-S-F/onyx/pkg/schema"
	"github.com/B-S-F/onyx/pkg/tempdir"
	"github.com/B-S-F/onyx/pkg/transformer"
	v2 "github.com/B-S-F/onyx/pkg/v2/config"
	model "github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/orchestrator"
	replacerV2 "github.com/B-S-F/onyx/pkg/v2/replacer"
	appV2 "github.com/B-S-F/onyx/pkg/v2/repository/app"
	registryV2 "github.com/B-S-F/onyx/pkg/v2/repository/registry"
	resultV2 "github.com/B-S-F/onyx/pkg/v2/result"
	transformerV2 "github.com/B-S-F/onyx/pkg/v2/transformer"
	"github.com/B-S-F/onyx/pkg/workdir"

	"github.com/B-S-F/onyx/pkg/zip"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
	"go.uber.org/zap"
	yaml "gopkg.in/yaml.v3"
)

const (
	CONFIG_FILE   = "qg-config.yaml"
	RESULT_FILE   = "qg-result.yaml"
	EVIDENCE_FILE = "evidence.zip"
	VARS_FILE     = ".vars"
	SECRETS_FILE  = ".secrets"
)

var (
	ROOT_WORK_DIRECTORY = tempdir.GetPath("evidences")
	APP_DIRECTORY       = tempdir.GetPath("apps")
)

func OverrideDirectoriesForTest(path string) {
	ROOT_WORK_DIRECTORY = path + "/evidences"
	APP_DIRECTORY = path + "/apps"
}

type exec struct {
	wdUtils         workdir.Utilizer
	configCreator   common.ConfigCreator
	schema          schema.SchemaHandler
	resultEngine    result.ResultEngine
	itemEngine      *item.Engine
	finalizerEngine *finalize.Engine
	transformer     []transformer.Transformer
	transformerV2   []transformerV2.Transformer
	logger          logger.Logger
	execParams      parameter.ExecutionParameter
}

func newExec(execParams parameter.ExecutionParameter) *exec {
	itemEngine := item.NewEngine(ROOT_WORK_DIRECTORY, execParams.Strict, execParams.CheckTimeout)
	finalizeEngine := finalize.NewEngine(ROOT_WORK_DIRECTORY, execParams.CheckTimeout)
	resultEngine := result.NewDefaultEngine(ROOT_WORK_DIRECTORY)
	transformer := []transformer.Transformer{
		transformer.NewAutopilotSkipper(execParams),
		transformer.NewConfigsLoader(ROOT_WORK_DIRECTORY),
	}
	return &exec{
		wdUtils:         workdir.NewUtils(afero.NewOsFs()),
		configCreator:   &common.ConfigCreatorImpl{},
		schema:          &schema.Schema{},
		resultEngine:    resultEngine,
		itemEngine:      itemEngine,
		finalizerEngine: finalizeEngine,
		transformer:     transformer,
		logger:          logger.Get(),
		execParams:      execParams,
		transformerV2:   []transformerV2.Transformer{transformerV2.NewAutopilotSkipper(execParams), transformerV2.NewConfigsLoader(ROOT_WORK_DIRECTORY)},
	}
}

func Exec(execParams parameter.ExecutionParameter) error {
	logger.Get().Info("[ PREPARATION ]")

	configFile, vars, secrets, err := ReadFiles(execParams, reader.New())
	if err != nil {
		return errors.Wrap(err, "error reading files")
	}
	defaultLogger := logger.NewCommon(logger.Settings{
		Secrets: secrets,
		File:    filepath.Join(ROOT_WORK_DIRECTORY, "onyx.log"),
	}) // this logger prevents secrets from being logged
	logger.Set(defaultLogger)
	e := newExec(execParams)
	err = e.prepareRootFolder(ROOT_WORK_DIRECTORY, execParams.InputFolder)
	if err != nil {
		return errors.Wrap(err, "error setting up root directory")
	}

	e.logger.Info("[ INITIALIZE EXECUTION PLAN ]")
	e.logger.Info("parsing config file")
	cfg, version, err := createConfig(configFile, e.configCreator)
	if err != nil {
		return errors.Wrap(err, "error creating config")
	}

	e.logger.Info("validating config file")
	err = validateSchema(e.schema, cfg, configFile)
	if err != nil {
		return errors.Wrap(err, "error validating schema")
	}

	switch version {
	case "v0", "v1":
		configV1, ok := cfg.(configuration.Config)
		if !ok {
			return errors.Errorf("provided config for version '%s' is of unexpected type '%T'", version, configFile)
		}
		execPlan, err := e.initPlanV1(configV1, vars, secrets)
		if err != nil {
			return err
		}
		return e.execPlanV1(execPlan, vars, secrets)

	case "v2":
		configV2, ok := cfg.(*v2.Config)
		if !ok {
			return errors.Errorf("provided config for version '%s' is of unexpected type '%T'", version, configFile)
		}

		ep, err := e.initPlanV2(configV2, vars, secrets)
		if err != nil {
			return err
		}

		return e.execPlanV2(ep, secrets)
	default:
		return errors.Errorf("unsupported version '%s'", version)
	}
}

func (e *exec) execPlanV1(ep *configuration.ExecutionPlan, vars map[string]string, secrets map[string]string) error {
	e.logger.Info("[ RUN EXECUTION PLAN ]")
	err := e.executePlan(ep, vars, secrets)
	if err != nil {
		return errors.Wrap(err, "error executing execution plan")
	}
	resultFilePath := filepath.Join(ROOT_WORK_DIRECTORY, RESULT_FILE)
	err = e.storeResultFile(e.resultEngine.GetResult(), resultFilePath)
	if err != nil {
		return errors.Wrap(err, "error storing result file")
	}
	e.logger.Info("[ RUN FINALIZER ]")
	err = e.executeFinalizer(ep, secrets)
	if err != nil {
		return errors.Wrap(err, "error executing finalizer")
	}
	err = e.storeResultFile(e.resultEngine.GetResult(), resultFilePath)
	if err != nil {
		return errors.Wrap(err, "error storing result file")
	}
	err = e.provideResultFiles()
	if err != nil {
		return errors.Wrap(err, "error providing result files")
	}
	return nil
}

func (e *exec) execPlanV2(ep *model.ExecutionPlan, secrets map[string]string) error {
	e.logger.Info("[ RUN EXECUTION PLAN ]")
	orchestrator := orchestrator.New(ROOT_WORK_DIRECTORY, e.execParams.Strict, e.execParams.CheckTimeout, e.logger)
	runResult, err := orchestrator.Run(ep.ManualChecks, ep.AutopilotChecks, ep.Env, secrets)
	if err != nil {
		return errors.Wrap(err, "error executing execution plan")
	}
	resFilePath := filepath.Join(ROOT_WORK_DIRECTORY, RESULT_FILE)
	resCreator := resultV2.New(e.logger)
	createdResult, err := resCreator.Create(*ep, runResult)
	if err != nil {
		return errors.Wrap(err, "error creating execution result")
	}
	err = resCreator.WriteResultFile(*createdResult, resFilePath)
	if err != nil {
		return errors.Wrap(err, "error writing result file")
	}
	if ep.Finalize != nil {
		e.logger.Info("[ RUN FINALIZER ]")
		finalizeRes, err := orchestrator.RunFinalizer(*ep.Finalize, ep.Env, secrets)
		if err != nil {
			return errors.Wrap(err, "error running finalizer")
		}

		err = resCreator.AppendFinalizeResult(createdResult, *finalizeRes, *ep.Finalize)
		if err != nil {
			return err
		}

		err = resCreator.WriteResultFile(*createdResult, resFilePath)
		if err != nil {
			return errors.Wrap(err, "error writing result file")
		}
	}
	err = e.provideResultFiles()
	if err != nil {
		return errors.Wrap(err, "error providing result files")
	}
	return nil
}

func (e *exec) prepareRootFolder(rootFolder, inputFolder string) error {
	rootPath, err := e.wdUtils.CreateDir(rootFolder)
	if err != nil {
		return errors.Wrapf(err, "error creating root directory '%s'", rootFolder)
	}
	ignore_files := []string{VARS_FILE, SECRETS_FILE}
	err = e.wdUtils.CopyFilesInFolder(inputFolder, rootFolder, ignore_files)
	if err != nil {
		return errors.Wrap(err, "error copying input folder")
	}
	// Make all files "read-only" to prevent users from editing them
	err = e.wdUtils.UpdatePermissionsForFilesInFolder(0444, rootPath)
	if err != nil {
		return errors.Wrap(err, "error setting permissions for files in root directory")
	}
	return nil
}

func (e *exec) initPlanV1(config configuration.Config, vars, secrets map[string]string) (*configuration.ExecutionPlan, error) {
	ep, err := config.Parse()
	if err != nil {
		return nil, errors.Wrap(err, "error creating execution plan")
	}

	e.logger.Info("replacing parameters in execution plan")
	err = replacer.Run(ep, vars, secrets, replacer.Initial)
	if err != nil {
		return nil, errors.Wrap(err, "error replacing parameters in execution plan")
	}
	e.logger.Info("transform execution plan")
	for _, transformer := range e.transformer {
		err = transformer.Transform(ep)
		if err != nil {
			return nil, errors.Wrap(err, "error transforming execution plan")
		}
	}
	e.logger.Info("replacing config file parameters in execution plan")
	err = replacer.Run(ep, vars, secrets, replacer.ConfigValues)
	if err != nil {
		return nil, errors.Wrap(err, "error replacing config file parameters second time in execution plan")
	}
	e.logger.Info("initializing repositories")
	repositories, err := initializeRepository(ep.Repositories)
	if err != nil {
		return nil, errors.Wrap(err, "error parsing repositories")
	}
	e.logger.Info("initializing app registry")
	appRegistry, err := initializeAppRegistry(ep, repositories)
	if err != nil {
		return nil, errors.Wrap(err, "error initializing app registry")
	}
	e.logger.Info(appRegistry.Stats())
	e.logger.Info("configuring aliases in execution plan items")
	err = e.initializeItemApps(ep, appRegistry)
	if err != nil {
		return nil, errors.Wrap(err, "error initializing item apps")
	}
	e.logger.Debug("execution plan", zap.String("execution plan", fmt.Sprintf("%+v", ep)))
	return ep, nil
}

func (e *exec) initPlanV2(config *v2.Config, vars, secrets map[string]string) (*model.ExecutionPlan, error) {
	e.logger.Info("executing custom config validation")
	if err := v2.Validate(config); err != nil {
		return nil, errors.Wrap(err, "custom config validation failed")
	}

	ep, err := config.CreateExecutionPlan()
	if err != nil {
		return nil, errors.Wrap(err, "failed to create execution plan")
	}

	e.logger.Info("replacing parameters in execution plan")
	err = replacerV2.Run(ep, vars, secrets, replacerV2.Initial)
	if err != nil {
		return nil, errors.Wrap(err, "error replacing parameters in execution plan")
	}

	e.logger.Info("transform execution plan")
	for _, transformer := range e.transformerV2 {
		err = transformer.Transform(ep)
		if err != nil {
			return nil, errors.Wrap(err, "error transforming execution plan")
		}
	}

	e.logger.Info("replacing config file parameters in execution plan")
	err = replacerV2.Run(ep, vars, secrets, replacerV2.ConfigValues)
	if err != nil {
		return nil, errors.Wrap(err, "error replacing config file parameters second time in execution plan")
	}

	e.logger.Info("initializing repositories")
	repositories, err := initializeRepository(ep.Repositories)
	if err != nil {
		return nil, errors.Wrap(err, "error parsing repositories")
	}

	e.logger.Info("initializing app registry")
	registry, err := registryV2.Initialize(ep, repositories)
	if err != nil {
		return nil, errors.Wrap(err, "error initializing app registry")
	}

	e.logger.Info(registry.Stats())
	e.logger.Info("configuring aliases in execution plan items")
	err = appV2.Initialize(ep, registry)
	if err != nil {
		return nil, errors.Wrap(err, "error initializing item apps")
	}
	e.logger.Debug("execution plan", zap.String("execution plan", fmt.Sprintf("%+v", ep)))
	return ep, nil
}

func createConfig(content []byte, configCreator common.ConfigCreator) (interface{}, string, error) {
	configVersion, err := common.ReadConfigVersion(content)
	if err != nil {
		return nil, "", errors.Wrap(err, "error reading config version")
	}
	cfg, err := configCreator.New(configVersion, content)
	if err != nil {
		return nil, "", err
	}

	return cfg, configVersion, nil
}

func validateSchema(schema schema.SchemaHandler, config interface{}, content []byte) error {
	err := schema.Load(config)
	if err != nil {
		return err
	}
	return schema.Validate(content)
}

func initializeAppRegistry(ep *configuration.ExecutionPlan, repositories []repository.Repository) (*registry.Registry, error) {
	appReferences := allAppReferences(ep)
	appRegistry := registry.NewRegistry(repositories)
	for _, appReference := range appReferences {
		err := appRegistry.Install(appReference)
		if err != nil {
			return nil, errors.Wrap(err, "error adding app to registry")
		}
	}
	return appRegistry, nil
}

func allAppReferences(ep *configuration.ExecutionPlan) []*app.Reference {
	var appReferences []*app.Reference
	for itemIndex := range ep.Items {
		item := &ep.Items[itemIndex]
		for _, itemAppReference := range item.AppReferences {
			appReferences = append(appReferences, toRepositoryAppReference(itemAppReference))
		}
	}
	return appReferences
}

func (e *exec) initializeItemApps(ep *configuration.ExecutionPlan, appRegistry *registry.Registry) error {
	for index := range ep.Items {
		item := &ep.Items[index]
		for _, configAppReference := range item.AppReferences {
			appReference := toRepositoryAppReference(configAppReference)
			app, err := appRegistry.Get(appReference)
			if err != nil {
				return errors.Wrap(err, "error getting app")
			}

			appExecutablePath := app.ExecutablePath()
			checkReference := fmt.Sprintf("%s_%s_%s", item.Chapter.Id, item.Requirement.Id, item.Check.Id)
			checkAppDirectory := filepath.Join(APP_DIRECTORY, checkReference)
			err = os.MkdirAll(checkAppDirectory, 0755)
			if err != nil {
				return errors.Wrapf(err, "error creating directory for app %s for check %s", app.Reference(), checkReference)
			}
			e.logger.Infof("configured app %s with checksum %s for check %s", app.Reference(), app.Checksum(), checkReference)

			symlinks := app.PossibleReferences()
			err = helper.CreateSymlinks(appExecutablePath, checkAppDirectory, symlinks)
			if err != nil {
				return errors.Wrap(err, "error creating symlinks")
			}
			item.AppPath = checkAppDirectory
		}
	}
	return nil
}

func toRepositoryAppReference(ref *configuration.AppReference) *app.Reference {
	return &app.Reference{
		Repository: ref.Repository,
		Name:       ref.Name,
		Version:    ref.Version,
	}
}

func (e *exec) executePlan(ep *configuration.ExecutionPlan, vars, secrets map[string]string) error {
	itemResults, err := e.itemEngine.Run(&ep.Items, ep.Env, vars, secrets)
	if err != nil {
		return errors.Wrap(err, "error running execution plan")
	}
	e.resultEngine.CreateNewResult(ep, &itemResults)
	return nil
}

func (e *exec) executeFinalizer(ep *configuration.ExecutionPlan, secrets map[string]string) error {
	if ep.Finalize.Name != "" {
		result, err := e.finalizerEngine.Run(&ep.Finalize, ep.Env, secrets)
		if err != nil {
			return errors.Wrap(err, "error running finalizer")
		}
		e.resultEngine.AppendFinalizerResult(result.Output)
	}
	return nil
}

func (e *exec) storeResultFile(data *v1Result.Result, path string) error {
	e.logger.Info(fmt.Sprintf("storing results in result file '%s'", filepath.Base(path)))
	resultYaml, err := yaml.Marshal(data)
	if err != nil {
		return errors.Wrap(err, "error marshalling result")
	}
	out := common.SelectOutputWriter(path)
	_, err = out.Write(resultYaml)
	if err != nil {
		return err
	}
	if out != os.Stdout {
		err = out.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

func (e *exec) provideResultFiles() error {
	e.logger.Info(fmt.Sprintf("providing evidences in '%s'", EVIDENCE_FILE))
	if _, err := os.Stat(e.execParams.OutputFolder); os.IsNotExist(err) {
		err = os.MkdirAll(e.execParams.OutputFolder, 0755)
		if err != nil {
			return errors.Wrap(err, "error creating output directory")
		}
	}
	data, rerr := os.ReadFile(filepath.Join(ROOT_WORK_DIRECTORY, RESULT_FILE))
	if rerr != nil {
		rerr = errors.Wrap(rerr, "error copying result file")
	} else {
		rerr = os.WriteFile(filepath.Join(e.execParams.OutputFolder, RESULT_FILE), data, 0644)
	}
	zip := zip.New(afero.NewOsFs())
	eerr := zip.Directory(ROOT_WORK_DIRECTORY, filepath.Join(e.execParams.OutputFolder, EVIDENCE_FILE))
	if eerr != nil {
		eerr = errors.Wrap(eerr, "error zipping evidence")
	}
	return helper.Join(rerr, eerr)
}
