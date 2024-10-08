package executor

import (
	"encoding/json"
	errs "errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/B-S-F/onyx/pkg/v2/output"
	"github.com/B-S-F/onyx/pkg/v2/runner"
	"github.com/B-S-F/onyx/pkg/workdir"
	"github.com/chigopher/pathlib"
	"github.com/pkg/errors"
)

type AutopilotExecutor struct {
	wdUtils     workdir.Utilizer
	rootWorkDir string
	strict      bool
	logger      *logger.Autopilot
	timeout     time.Duration
	runner      *runner.Subprocess
}

type stepDirs struct {
	stepDir  string
	workDir  string
	filesDir string
}

type evaluateResult struct {
	status  string
	reason  string
	results []model.Result
}

func NewAutopilotExecutor(wdUtils workdir.Utilizer, rootWorkDir string, strict bool, logger *logger.Autopilot, timeout time.Duration) *AutopilotExecutor {
	return &AutopilotExecutor{
		wdUtils:     wdUtils,
		rootWorkDir: rootWorkDir,
		strict:      strict,
		logger:      logger,
		timeout:     timeout,
		runner:      runner.NewSubprocess(logger),
	}
}

func (a *AutopilotExecutor) ExecuteAutopilotCheck(item *model.AutopilotCheck, env, secrets map[string]string) (*model.AutopilotResult, error) {
	if result := checkErrors(item, a.logger); result != nil {
		return result, nil
	}

	// setup
	sysPATH := os.Getenv("PATH")
	if item.AppPath != "" {
		sysPATH = fmt.Sprintf("%s:%s", item.AppPath, sysPATH)
	}
	checkUid := strings.Join([]string{item.Chapter.Id, item.Requirement.Id, item.Check.Id}, "_")
	checkDir, err := a.wdUtils.CreateDir(a.rootWorkDir, checkUid)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to create check directory for check '%s'", checkUid))
	}
	var stepsDir *pathlib.Path
	if len(item.Autopilot.Steps) > 0 {
		stepsDir, err = a.wdUtils.CreateDir(checkDir.String(), "steps")
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("failed to create steps directory for check '%s'", checkUid))
		}
	}
	var stepResults []model.StepResult
	for _, stepsLevel := range item.Autopilot.Steps {
		for _, step := range stepsLevel {
			// prepare directory structure
			stepDirs, err := prepareStepDirs(a.wdUtils, stepsDir.String(), step.ID)
			if err != nil {
				return nil, errors.Wrap(err, fmt.Sprintf("failed to create step directories for step '%s'", step.ID))
			}
			// create specified configuration files
			err = createConfigFiles(a.wdUtils, step.Configs, stepDirs.workDir)
			if err != nil {
				return nil, errors.Wrap(err, fmt.Sprintf("failed to create config files for step '%s'", step.ID))
			}
			// link required files
			err = a.wdUtils.LinkFiles(a.rootWorkDir, stepDirs.workDir)
			defer a.wdUtils.RemoveLinkedFiles(stepDirs.workDir)
			if err != nil {
				return nil, errors.Wrap(err, fmt.Sprintf("failed to link files for step '%s'", step.ID))
			}
			// prepare input directories
			var inputDirs []string
			for _, depend := range step.Depends {
				dependDir := filepath.Join(stepsDir.String(), depend, "files")
				if _, err := os.Stat(dependDir); os.IsNotExist(err) {
					return nil, errors.Wrap(err, fmt.Sprintf("step '%s' depends on '%s' but the step doesn't exist or didn't execute properly", step.ID, depend))
				}
				inputDirs = append(inputDirs, dependDir)
			}
			// prepare environment variables
			specialEnv := map[string]string{
				"APPS":                  item.AppPath,
				"PATH":                  sysPATH,
				"AUTOPILOT_OUTPUT_DIR":  stepDirs.filesDir,
				"AUTOPILOT_INPUT_DIRS":  strings.Join(inputDirs, strconv.QuoteRune(os.PathListSeparator)),
				"AUTOPILOT_RESULT_FILE": filepath.Join(stepDirs.stepDir, "data.json"),
			}
			runtimeEnv := helper.MergeMaps(env, step.Env, item.Autopilot.Env, specialEnv)
			// do run
			a.logger.Info(fmt.Sprintf("starting autopilot '%s' step '%s'", item.Autopilot.Name, step.ID))
			runnerOutput, err := StartRunner(stepDirs.workDir, step.Run, runtimeEnv, secrets, a.logger, a.runner, a.timeout)
			if err != nil {
				return nil, errors.Wrap(err, fmt.Sprintf("failed to run autopilot '%s' step '%s'", item.Autopilot.Name, step.ID))
			}
			// get step result and log output
			stepResult := parseStepResult(runnerOutput, step.ID, stepDirs, inputDirs)
			if err := writeLogs(stepDirs.stepDir, a.wdUtils, stepResult.Logs); err != nil {
				a.logger.Info(fmt.Sprintf("couldn't write logs for autopilot '%s' step '%s'", item.Autopilot.Name, step.ID))
			}
			stepResults = append(stepResults, stepResult)
		}
	}

	// do evaluation
	evalDir, err := a.wdUtils.CreateDir(checkDir.String(), "evaluation")
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to create evaluation directory '%s'", evalDir))
	}
	err = createConfigFiles(a.wdUtils, item.Autopilot.Evaluate.Configs, evalDir.String())
	if err != nil {
		return nil, errors.Wrap(err, "failed to create configuration files for evaluation")
	}
	var evalInputFiles []string
	for _, step := range stepResults {
		dataFile := step.ResultFile
		if _, err := os.Stat(dataFile); err == nil {
			evalInputFiles = append(evalInputFiles, dataFile)
		}
	}
	specialEnv := map[string]string{
		"PATH":                  sysPATH,
		"EVALUATOR_INPUT_FILES": strings.Join(evalInputFiles, strconv.QuoteRune(os.PathListSeparator)),
		"EVALUATOR_RESULT_FILE": filepath.Join(evalDir.String(), "result.json"),
	}
	runtimeEnv := helper.MergeMaps(env, item.Autopilot.Evaluate.Env, specialEnv)
	a.logger.Info("doing evaluation")
	evalOutput, err := StartRunner(evalDir.String(), item.Autopilot.Evaluate.Run, runtimeEnv, secrets, a.logger, a.runner, a.timeout)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to run autopilot '%s' evaluation", item.Autopilot.Name))
	}

	if len(evalOutput.Logs) > 0 {
		if err := writeLogs(evalDir.String(), a.wdUtils, evalOutput.Logs); err != nil {
			a.logger.Warn(fmt.Sprintf("failed to write logs for autopilot '%s' evaluation", item.Autopilot.Name))
		}
	}
	evalResult, err := parseEvaluatorResult(evalOutput)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse evaluate result")
	}
	autopilotResult := &model.AutopilotResult{
		StepResults: stepResults,
		EvaluateResult: model.EvaluateResult{
			ExitCode: evalOutput.ExitCode,
			Logs:     evalOutput.Logs,
			Results:  evalResult.results,
			Status:   evalResult.status,
			Reason:   evalResult.reason,
		},
		Name: item.Autopilot.Name,
	}
	checkResult(autopilotResult, a.strict, a.timeout, a.logger)
	output := output.Output{
		ExitCode:     autopilotResult.EvaluateResult.ExitCode,
		EvidencePath: checkDir.String(),
		Status:       autopilotResult.EvaluateResult.Status,
		Reason:       autopilotResult.EvaluateResult.Reason,
		Results:      autopilotResult.EvaluateResult.Results,
		Name:         autopilotResult.Name,
	}
	err = output.Log(a.logger)
	if err != nil {
		return nil, err
	}

	return autopilotResult, nil
}

func checkErrors(item *model.AutopilotCheck, logger *logger.Autopilot) *model.AutopilotResult {
	if len(item.ValidationErrs) > 0 {
		msg := fmt.Sprintf("autopilot '%s' has the following validation errors and won't be executed: %s", item.Autopilot.Name, errs.Join(item.ValidationErrs...).Error())
		output := &model.AutopilotResult{
			EvaluateResult: model.EvaluateResult{
				ExitCode: 0,
				Status:   "ERROR",
				Reason:   msg,
			},
			Name: item.Autopilot.Name,
		}
		logger.Error(msg)
		return output
	}
	return nil
}

func parseStepResult(runnerOutput *runner.Output, id string, stepDirs *stepDirs, inputDirs []string) model.StepResult {
	result := model.StepResult{
		ID:        id,
		OutputDir: stepDirs.filesDir,
		Logs:      runnerOutput.Logs,
		InputDirs: inputDirs,
		ExitCode:  runnerOutput.ExitCode,
	}
	resultFile := filepath.Join(stepDirs.stepDir, "data.json")
	if _, err := os.Stat(resultFile); err == nil {
		result.ResultFile = resultFile
	}
	return result
}

func prepareStepDirs(wdUtils workdir.Utilizer, stepsDir, stepID string) (*stepDirs, error) {
	stepDir, err := wdUtils.CreateDir(stepsDir, stepID)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to create step directory for step '%s'", stepID))
	}
	workDir, err := wdUtils.CreateDir(stepDir.String(), "work")
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to create work directory for step '%s'", stepID))
	}
	outputDir, err := wdUtils.CreateDir(stepDir.String(), "files")
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to create output directory for step '%s'", stepID))
	}
	return &stepDirs{
		workDir:  workDir.String(),
		filesDir: outputDir.String(),
		stepDir:  stepDir.String(),
	}, nil
}

func createConfigFiles(wdUtils workdir.Utilizer, config map[string]string, workDir string) error {
	for file, content := range config {
		err := wdUtils.CreateFile(filepath.Join(workDir, file), []byte(content))
		if err != nil {
			return errors.Wrapf(err, "failed to write configuration file '%s'", file)
		}
	}
	return nil
}

func writeLogs(workDir string, wdUtils workdir.Utilizer, logs []model.LogEntry) error {
	jsonLogs, err := json.MarshalIndent(logs, "", "  ")
	if err != nil {
		return err
	}

	if err := wdUtils.CreateFile(filepath.Join(workDir, "logs.txt"), jsonLogs); err != nil {
		return err
	}
	return nil
}

func parseEvaluatorResult(runnerOutput *runner.Output) (*evaluateResult, error) {
	out := &evaluateResult{}
	for _, data := range runnerOutput.JsonData {
		if status, ok := data["status"].(string); ok {
			out.status = status
		}

		if reason, ok := data["reason"].(string); ok {
			out.reason = reason
		}
		if results, ok := data["result"].(map[string]interface{}); ok {
			r := model.Result{}
			resultMap := results
			if criteria, ok := resultMap["criterion"].(string); ok {
				r.Criterion = criteria
			}
			if fulfilled, ok := resultMap["fulfilled"].(bool); ok {
				r.Fulfilled = fulfilled
			}
			if justification, ok := resultMap["justification"].(string); ok {
				r.Justification = justification
			}
			if metadata, ok := resultMap["metadata"].(map[string]interface{}); ok {
				dataMap := make(map[string]string)
				for k, v := range metadata {
					switch v.(type) {
					// All complex objects are reverted to fit into the string format to match the expected output
					case map[string]interface{}:
						marshaled, err := json.Marshal(v)
						if err != nil {
							return nil, err
						}
						dataMap[k] = string(marshaled)
					default:
						dataMap[k] = fmt.Sprintf("%v", v)
					}
				}
				if len(dataMap) > 0 {
					r.Metadata = dataMap
				}
			}
			out.results = append(out.results, r)
		}
	}
	return out, nil
}

func checkResult(result *model.AutopilotResult, strict bool, timeout time.Duration, logger *logger.Autopilot) {
	if result.EvaluateResult.ExitCode != 0 {
		var msg string
		if result.EvaluateResult.ExitCode == 124 {
			msg = fmt.Sprintf("autopilot '%s' timed out after %s", result.Name, timeout)
		} else {
			msg = fmt.Sprintf("autopilot '%s' exited with exit code %d", result.Name, result.EvaluateResult.ExitCode)
		}
		result.EvaluateResult.Status = "ERROR"
		result.EvaluateResult.Reason = msg
		logger.Error(msg)
		return
	}
	// autopilot must provide a status of RED, GREEN, YELLOW
	allowedStatus := []string{"RED", "GREEN", "YELLOW"}
	if !helper.Contains(allowedStatus, result.EvaluateResult.Status) {
		msg := fmt.Sprintf("autopilot '%s' provided an invalid 'status': '%s'", result.Name, result.EvaluateResult.Status)
		result.EvaluateResult.Status = "ERROR"
		result.EvaluateResult.Reason = msg
		logger.Error(msg)
		return
	}
	// autopilot must provide a reason
	var msgs []string
	if result.EvaluateResult.Reason == "" {
		msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'reason'", result.Name))
	}
	// autopilot with status RED, GREEN, YELLOW must provide results
	if result.EvaluateResult.Results == nil || len(result.EvaluateResult.Results) == 0 {
		msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide any 'results'", result.Name))
	}
	// autopilot must provide a criterion and justification for each result
	for i, r := range result.EvaluateResult.Results {
		if r.Criterion == "" {
			msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'criterion' in result '%d'", result.Name, i))
		}
		if r.Justification == "" {
			msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'justification' in result '%d'", result.Name, i))
		}
	}
	if len(msgs) == 0 {
		return
	}
	msg := strings.Join(msgs, "; ")
	if strict {
		result.EvaluateResult.Status = "ERROR"
		result.EvaluateResult.Reason = msg
		logger.Error(msg)
		return
	} else {
		logger.Warn(msg)
	}
}
