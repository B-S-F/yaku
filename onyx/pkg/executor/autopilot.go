package executor

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/runner"
	"github.com/B-S-F/onyx/pkg/workdir"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
	"go.uber.org/zap"
)

type Autopilot struct {
	strict  bool
	wdUtils workdir.Utilizer
	Exec
}

func NewAutopilot(strict bool, rootWorkDir string, timeout time.Duration, logger *logger.Autopilot) *Autopilot {
	exec := Exec{
		runner:      runner.NewSubprocess(logger),
		rootWorkDir: rootWorkDir,
		timeout:     timeout,
		logger:      logger,
	}
	return &Autopilot{
		strict,
		workdir.NewUtils(afero.NewOsFs()),
		exec,
	}
}

func (a *Autopilot) Execute(config *configuration.Item, env, vars, secrets map[string]string) (*Output, error) {
	output, ok := a.checkItem(config)
	if !ok {
		return output, nil
	}

	sysPATH := os.Getenv("PATH")
	if config.AppPath != "" {
		sysPATH = fmt.Sprintf("%s:%s", config.AppPath, sysPATH)
	}

	wd, err := a.wdUtils.CreateDir(a.rootWorkDir, strings.Join([]string{config.Chapter.Id, config.Requirement.Id, config.Check.Id}, "_"))
	if err != nil {
		return nil, errors.Wrap(err, "failed to create workdir")
	}
	err = a.createConfigFiles(config.Config, wd.String())
	if err != nil {
		return nil, errors.Wrap(err, "failed to create config files")
	}
	err = a.wdUtils.LinkFiles(a.rootWorkDir, wd.String())
	defer a.wdUtils.RemoveLinkedFiles(wd.String())
	if err != nil {
		return nil, errors.Wrap(err, "failed to link files")
	}
	a.logger.Info(fmt.Sprintf("starting autopilot '%s'", config.Autopilot.Name))
	specialEnv := map[string]string{"evidence_path": ".", "APPS": config.AppPath, "PATH": sysPATH}
	runtimeEnv := helper.MergeMaps(env, config.Autopilot.Env, config.Env, specialEnv)
	runnerOutput, err := a.startRunner(wd.String(), config.Autopilot.Run, runtimeEnv, secrets)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run autopilot")
	}
	output = a.output(runnerOutput, config.Autopilot.Name)
	a.checkOutput(output, a.strict)
	output.Log(a.logger)
	err = a.storeFiles(runtimeEnv, vars, secrets, output.EvidencePath)
	if err != nil {
		return nil, errors.Wrap(err, "failed to store files")
	}
	return output, nil
}

func (a *Autopilot) createConfigFiles(config map[string]string, workDir string) error {
	for file, content := range config {
		err := a.wdUtils.CreateFile(filepath.Join(workDir, file), []byte(content))
		if err != nil {
			return errors.Wrapf(err, "failed to write config file '%s'", file)
		}
	}
	return nil
}

func (a *Autopilot) storeFiles(env, vars, secrets map[string]string, folder string) error {
	wdUtils := workdir.NewUtils(afero.NewOsFs())
	// .env file
	helper.HideSecretsInMap(&env, secrets)
	envsContent, err := json.Marshal(env)
	if err != nil {
		return errors.Wrap(err, "failed to marshal env to json")
	}
	err = wdUtils.CreateFile(filepath.Join(folder, ".env"), envsContent)
	if err != nil {
		return errors.Wrap(err, "failed to write .env file")
	}
	// .vars file
	varsContent, err := json.Marshal(vars)
	if err != nil {
		return errors.Wrap(err, "failed to marshal vars to json")
	}
	err = wdUtils.CreateFile(filepath.Join(folder, ".vars"), varsContent)
	if err != nil {
		return errors.Wrap(err, "failed to write .vars file")
	}
	// .secrets file
	maskedSecrets := helper.CopyStringMap(secrets)
	helper.HideValuesInMap(&maskedSecrets)
	secretsContent, err := json.Marshal(maskedSecrets)
	if err != nil {
		return errors.Wrap(err, "failed to marshal secrets to json")
	}
	err = wdUtils.CreateFile(filepath.Join(folder, ".secrets"), secretsContent)
	if err != nil {
		return errors.Wrap(err, "failed to write .secrets file")
	}
	return nil
}

func (a *Autopilot) output(runnerOutput *runner.Output, name string) *Output {
	defer func() {
		if err := recover(); err != nil {
			a.logger.Error("Recovered from panic", zap.Any("error", err))
		}
	}()
	out := &Output{}
	out.Name = name
	out.ExecutionType = "Automation"
	out.EvidencePath = runnerOutput.WorkDir
	out.Logs = runnerOutput.Logs
	out.ErrLogs = runnerOutput.ErrLogs
	out.ExitCode = runnerOutput.ExitCode
	for _, data := range runnerOutput.Data {
		if status, ok := data["status"].(string); ok {
			out.Status = status
		}

		if reason, ok := data["reason"].(string); ok {
			out.Reason = reason
		}

		if results, ok := data["result"].(map[string]interface{}); ok {
			r := Result{}
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
						marshaled, _ := json.Marshal(v)
						dataMap[k] = string(marshaled)
					default:
						dataMap[k] = fmt.Sprintf("%v", v)
					}
				}
				if len(dataMap) > 0 {
					r.Metadata = dataMap
				}
			}
			out.Results = append(out.Results, r)
		}

		if output, ok := data["output"].(map[string]interface{}); ok {
			if out.Outputs == nil {
				out.Outputs = make(map[string]string)
			}
			for k, v := range output {
				if v, ok := v.(string); ok {
					out.Outputs[k] = v
				}
			}
			if len(out.Outputs) == 0 {
				out.Outputs = nil
			}
		}
	}
	return out
}

func (a *Autopilot) checkItem(item *configuration.Item) (*Output, bool) {
	if item.ValidationErr != "" {
		msg := fmt.Sprintf("autopilot '%s' is invalid and could not be executed: %s", item.Autopilot.Name, item.ValidationErr)
		output := &Output{
			ExecutionType: "None",
			ExitCode:      0,
			Name:          item.Autopilot.Name,
			Status:        "ERROR",
			Reason:        msg,
		}
		a.logger.Error(msg)
		return output, false
	}
	return nil, true
}

func (a *Autopilot) checkOutput(output *Output, strict bool) {
	if output.ExitCode != 0 {
		var msg string
		if output.ExitCode == 124 {
			msg = fmt.Sprintf("autopilot '%s' timed out after %s", output.Name, a.timeout)
		} else {
			msg = fmt.Sprintf("autopilot '%s' exited with exit code %d", output.Name, output.ExitCode)
		}
		output.Status = "ERROR"
		output.Reason = msg
		a.logger.Error(msg)
		return
	}
	// autopilot must provide a status of RED, GREEN, YELLOW, or FAILED
	allowedStatus := []string{"RED", "GREEN", "YELLOW", "FAILED"}
	if !helper.Contains(allowedStatus, output.Status) {
		msg := fmt.Sprintf("autopilot '%s' provided an invalid 'status': '%s'", output.Name, output.Status)
		output.Status = "ERROR"
		output.Reason = msg
		a.logger.Error(msg)
		return
	}
	// autopilot must provide a reason
	var msgs []string
	if output.Reason == "" {
		msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'reason'", output.Name))
	}
	// autopilot with status RED, GREEN, YELLOW must provide results
	if output.Status != "FAILED" {
		if len(output.Results) == 0 {
			msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide any 'results'", output.Name))
		}
		// autopilot must provide a criterion and justification for each result
		for i, r := range output.Results {
			if r.Criterion == "" {
				msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'criterion' in result '%d'", output.Name, i))
			}
			if r.Justification == "" {
				msgs = append(msgs, fmt.Sprintf("autopilot '%s' did not provide a 'justification' in result '%d'", output.Name, i))
			}
		}
	}
	if len(msgs) == 0 {
		return
	}
	msg := strings.Join(msgs, "; ")
	if strict {
		output.Status = "ERROR"
		output.Reason = msg
		a.logger.Error(msg)
		return
	} else {
		a.logger.Warn(msg)
	}
}
