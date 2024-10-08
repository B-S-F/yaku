package result

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/result/common"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

const (
	errorStatus       = "ERROR"
	redStatus         = "RED"
	yellowStatus      = "YELLOW"
	greenStatus       = "GREEN"
	skippedStatus     = "SKIPPED"
	unansweredStatus  = "UNANSWERED"
	naStatus          = "NA"
	jsonLogWarningKey = "warning"
	jsonLogMessageKey = "message"
)

type Creator struct {
	logger logger.Logger
}

func New(logger logger.Logger) *Creator {
	return &Creator{logger: logger}
}

func (c *Creator) Create(ep model.ExecutionPlan, runResult model.RunResult) (*Result, error) {
	var res Result

	res.Chapters = make(map[string]*Chapter)

	c.logger.Info("creating result")

	c.addMetadata(&res, ep)

	for _, m := range runResult.Manuals {
		c.logger.Debug("Add manual-check to result", zap.Any("manual-check", m))

		c.addManualResult(res.Chapters, m)

		switch m.Result.Status {
		case unansweredStatus:
			res.Statistics.CountUnansweredChecks++
		case skippedStatus:
			res.Statistics.CountSkippedChecks++
		}

		res.Statistics.CountManualChecks++
		res.Statistics.CountChecks++
	}

	for _, a := range runResult.Autopilots {
		c.logger.Debug("Add autopilot-check to result", zap.Any("autopilot-check", a))

		err := c.addAutopilotResult(res.Chapters, a)
		if err != nil {
			return nil, err
		}

		if a.Result.EvaluateResult.Status == skippedStatus {
			res.Statistics.CountSkippedChecks++
		}

		res.Statistics.CountAutomatedChecks++
		res.Statistics.CountChecks++
	}

	for _, chap := range res.Chapters {
		calculateChapterStatus(chap)
		res.OverallStatus = getPriorityStatus(res.OverallStatus, chap.Status)
	}

	if res.Statistics.CountChecks > 0 {
		res.Statistics.PercentageAutomated = getPercentage(res.Statistics.CountAutomatedChecks, res.Statistics.CountChecks)
		res.Statistics.PercentageDone = getPercentage(res.Statistics.CountChecks-res.Statistics.CountUnansweredChecks, res.Statistics.CountChecks)
	}

	return &res, nil
}

func (c *Creator) AppendFinalizeResult(res *Result, finalizeResult model.FinalizeResult, finalize model.Finalize) error {
	configs := make([]string, 0, len(finalize.Configs))
	for cfg := range finalize.Configs {
		configs = append(configs, cfg)
	}

	logs, err := c.marshalLogs(finalizeResult.Logs)
	if err != nil {
		return errors.Wrap(err, "failed to json marshal log entries")
	}

	res.Finalize = &Finalize{
		Logs:        logs,
		Warnings:    c.extractLogs(finalizeResult.Logs, jsonLogWarningKey),
		Messages:    c.extractLogs(finalizeResult.Logs, jsonLogMessageKey),
		ConfigFiles: configs,
		ExitCode:    finalizeResult.ExitCode,
	}

	return nil
}

func (c *Creator) marshalLogs(logs []model.LogEntry) ([]string, error) {
	var result []string
	for _, log := range logs {
		logLine, err := json.Marshal(log)
		if err != nil {
			return nil, err
		}

		result = append(result, string(logLine))
	}

	return result, nil
}

func (c *Creator) extractLogs(logs []model.LogEntry, jsonLogKey string) []string {
	var results []string
	for _, log := range logs {
		if v, exists := log.Json[jsonLogKey]; exists {
			if value, ok := v.(string); ok {
				results = append(results, value)
			}
		}
	}

	return results
}

func (c *Creator) WriteResultFile(res Result, path string) error {
	c.logger.Info(fmt.Sprintf("storing results in result file '%s'", filepath.Base(path)))
	resYaml, err := yaml.Marshal(res)
	if err != nil {
		return errors.Wrap(err, "failed to marshal result into yaml")
	}

	file, err := os.Create(path)
	if err != nil {
		return errors.Wrapf(err, "failed to create output file '%s'", path)
	}
	defer file.Close()

	_, err = file.Write(resYaml)
	if err != nil {
		return errors.Wrap(err, "failed to write result to output file")
	}

	return nil
}

func (c *Creator) addMetadata(res *Result, ep model.ExecutionPlan) {
	res.Metadata.Version = res.version()
	res.Header.Name = ep.Header.Name
	res.Header.Version = ep.Header.Version
	res.Header.Date = time.Now().Local().Format(time.RFC3339)
	res.Header.ToolVersion = helper.ToolVersion
}

func (c *Creator) addAutopilotResult(chapters map[string]*Chapter, a model.AutopilotRun) error {
	chapter, ok := chapters[a.AutopilotCheck.Chapter.Id]
	if !ok {
		chapter = mapChapter(a.AutopilotCheck.Chapter)
		chapters[a.AutopilotCheck.Chapter.Id] = chapter
	}

	requirement, ok := chapter.Requirements[a.AutopilotCheck.Requirement.Id]
	if !ok {
		requirement = mapRequirement(a.AutopilotCheck.Requirement)
		chapter.Requirements[a.AutopilotCheck.Requirement.Id] = requirement
	}

	_, ok = requirement.Checks[a.AutopilotCheck.Check.Id]
	if !ok {
		stepsByID := make(map[string]model.Step)
		for _, stepLvl := range a.AutopilotCheck.Autopilot.Steps {
			for _, s := range stepLvl {
				stepsByID[s.ID] = s
			}
		}

		steps, err := c.createSteps(a.Result.StepResults, stepsByID)
		if err != nil {
			return err
		}

		var evaluationCfgs []string
		for cfgFilename := range a.AutopilotCheck.Autopilot.Evaluate.Configs {
			evaluationCfgs = append(evaluationCfgs, cfgFilename)
		}

		var evaluationResults []EvaluationResult
		for _, result := range a.Result.EvaluateResult.Results {
			evaluationResults = append(evaluationResults, EvaluationResult{
				Criterion:     common.MultilineString(result.Criterion),
				Fulfilled:     result.Fulfilled,
				Justification: common.MultilineString(result.Justification),
				Metadata:      result.Metadata,
			})
		}

		evaluateLogs, err := c.marshalLogs(a.Result.EvaluateResult.Logs)
		if err != nil {
			return errors.Wrap(err, "failed to json marshal log entries")
		}

		requirement.Checks[a.AutopilotCheck.Check.Id] = &Check{
			Title: a.AutopilotCheck.Check.Title,
			Type:  "automation",
			Autopilots: []Autopilot{
				{
					Name:  a.AutopilotCheck.Autopilot.Name,
					Steps: steps,
				},
			},
			Evaluation: Evaluation{
				Status:      a.Result.EvaluateResult.Status,
				Reason:      a.Result.EvaluateResult.Reason,
				ConfigFiles: evaluationCfgs,
				Results:     evaluationResults,
				Logs:        evaluateLogs,
				Warnings:    c.extractLogs(a.Result.EvaluateResult.Logs, jsonLogWarningKey),
				Messages:    c.extractLogs(a.Result.EvaluateResult.Logs, jsonLogMessageKey),
				ExitCode:    a.Result.EvaluateResult.ExitCode,
			},
		}
	}

	return nil
}

func (c *Creator) createSteps(stepResults []model.StepResult, stepsByID map[string]model.Step) ([]Step, error) {
	var steps []Step
	for _, s := range stepResults {
		stepModel, ok := stepsByID[s.ID]
		if !ok {
			return nil, fmt.Errorf("could not find Step model with ID '%s' from the StepResults", s.ID)
		}

		var cfgs []string
		for cfgFilename := range stepModel.Configs {
			cfgs = append(cfgs, cfgFilename)
		}

		logs, err := c.marshalLogs(s.Logs)
		if err != nil {
			return nil, errors.Wrap(err, "failed to json marshal log entries")
		}

		steps = append(steps, Step{
			Title:       stepModel.Title,
			Id:          s.ID,
			Depends:     stepModel.Depends,
			ConfigFiles: cfgs,
			InputDirs:   s.InputDirs,
			OutputDir:   s.OutputDir,
			ResultFile:  s.ResultFile,
			Logs:        logs,
			Warnings:    c.extractLogs(s.Logs, jsonLogWarningKey),
			Messages:    c.extractLogs(s.Logs, jsonLogMessageKey),
			ExitCode:    s.ExitCode,
		})
	}

	return steps, nil
}

func (c *Creator) addManualResult(chapters map[string]*Chapter, m model.ManualRun) {
	chapter, ok := chapters[m.ManualCheck.Chapter.Id]
	if !ok {
		chapter = mapChapter(m.ManualCheck.Chapter)
		chapters[m.ManualCheck.Chapter.Id] = chapter
	}

	requirement, ok := chapter.Requirements[m.ManualCheck.Requirement.Id]
	if !ok {
		requirement = mapRequirement(m.ManualCheck.Requirement)
		chapter.Requirements[m.ManualCheck.Requirement.Id] = requirement
	}

	_, ok = requirement.Checks[m.ManualCheck.Check.Id]
	if !ok {
		requirement.Checks[m.ManualCheck.Check.Id] = &Check{
			Title: m.ManualCheck.Check.Title,
			Type:  "manual",
			Evaluation: Evaluation{
				Status: m.Result.Status,
				Reason: m.Result.Reason,
			},
		}
	}
}

func mapChapter(chap configuration.Chapter) *Chapter {
	return &Chapter{
		Title:        chap.Title,
		Text:         chap.Text,
		Requirements: make(map[string]*Requirement),
	}
}

func mapRequirement(req configuration.Requirement) *Requirement {
	return &Requirement{
		Title:  req.Title,
		Text:   req.Text,
		Checks: make(map[string]*Check),
	}
}

func calculateChapterStatus(chap *Chapter) {
	for _, req := range chap.Requirements {
		calculateRequirementStatus(req)
		chap.Status = getPriorityStatus(chap.Status, req.Status)
	}
}

func calculateRequirementStatus(req *Requirement) {
	for _, check := range req.Checks {
		req.Status = getPriorityStatus(req.Status, check.Evaluation.Status)
	}
}

func getPriorityStatus(statusA, statusB string) string {
	switch {
	case statusA == errorStatus || statusB == errorStatus:
		return errorStatus

	case statusA == redStatus || statusB == redStatus:
		return redStatus

	case statusA == yellowStatus || statusB == yellowStatus:
		return yellowStatus

	case statusA == greenStatus || statusB == greenStatus:
		return greenStatus

	case statusA == skippedStatus || statusB == skippedStatus:
		return skippedStatus

	case statusA == unansweredStatus || statusB == unansweredStatus:
		return unansweredStatus

	default:
		return naStatus
	}
}

func getPercentage(numerator, denominator uint) float64 {
	return math.Round(float64(numerator)*10000.0/float64(denominator)) / 100.0
}
