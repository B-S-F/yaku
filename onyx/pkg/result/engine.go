package result

import (
	"math"
	"path/filepath"
	"time"

	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/helper"
	"github.com/B-S-F/onyx/pkg/item"
	"github.com/B-S-F/onyx/pkg/logger"
	"github.com/B-S-F/onyx/pkg/result/common"
	v1 "github.com/B-S-F/onyx/pkg/result/v1"
	"go.uber.org/zap"
)

const currentResultVersion = "v1"

const (
	Manual     = "Manual"
	Automation = "Automation"
)

type DefaultResultEngine struct {
	rootPath string
	Result   v1.Result
	logger   logger.Logger
}

func NewDefaultEngine(rootPath string) ResultEngine {
	engine := DefaultResultEngine{
		rootPath: rootPath,
		Result:   v1.Result{},
		logger:   logger.Get(),
	}
	return &engine
}

func toPercent(numerator, denominator uint) float64 {
	return math.Round(float64(numerator)*10000.0/float64(denominator)) / 100.0
}

func (res *DefaultResultEngine) CreateNewResult(executionPlan *configuration.ExecutionPlan, itemResults *[]item.Result) {
	res.Result.Chapters = make(map[string]*v1.Chapter)
	res.Result.Finalize = nil

	res.logger.Info("creating result")

	res.addMetaInformation(executionPlan)

	for _, item := range *itemResults {
		res.logger.Debug("Add item to result", zap.Any("item", item))
		res.addItemResult(&item)
	}
	computeResultStatus(&res.Result)
	res.Result.Statistics.PercentageAutomated = toPercent(res.Result.Statistics.CountAutomatedChecks, res.Result.Statistics.CountChecks)
	res.Result.Statistics.PercentageDone = toPercent(res.Result.Statistics.CountChecks-res.Result.Statistics.CountUnansweredChecks, res.Result.Statistics.CountChecks)
}

func (res *DefaultResultEngine) AppendFinalizerResult(finalizerResult *executor.Output) {
	path, _ := filepath.Rel(res.rootPath, finalizerResult.EvidencePath)
	res.Result.Finalize = &v1.Finalize{
		Execution: v1.ExecutionInformation{
			Logs:         finalizerResult.Logs,
			ErrorLogs:    finalizerResult.ErrLogs,
			ExitCode:     finalizerResult.ExitCode,
			EvidencePath: path,
		},
	}
}

func (res *DefaultResultEngine) GetResult() *v1.Result {
	return &res.Result
}

func determineCombinedStatus(currentStatus string, newStatus string) string {
	if currentStatus == ERROR || newStatus == ERROR {
		return ERROR
	}
	if currentStatus == v1.FAILED || newStatus == v1.FAILED {
		return v1.FAILED
	}
	if currentStatus == RED || newStatus == RED {
		return RED
	}
	if currentStatus == YELLOW || newStatus == YELLOW {
		return YELLOW
	}
	if currentStatus == GREEN || newStatus == GREEN {
		return GREEN
	}
	if currentStatus == v1.SKIPPED || newStatus == v1.SKIPPED {
		return v1.SKIPPED
	}
	if currentStatus == UNANSWERED || newStatus == UNANSWERED {
		return UNANSWERED
	}
	return v1.NA
}

func computeCheckStatus(check *v1.Check) {
	check.Status = string(check.Evaluation.Status)
}

func computeRequirementStatus(requirement *v1.Requirement) {
	for _, check := range requirement.Checks {
		computeCheckStatus(check)
		requirement.Status = determineCombinedStatus(requirement.Status, check.Status)
	}
}

func computeChapterStatus(chapter *v1.Chapter) {
	for _, requirement := range chapter.Requirements {
		computeRequirementStatus(requirement)
		chapter.Status = determineCombinedStatus(chapter.Status, requirement.Status)
	}
}

func computeResultStatus(result *v1.Result) {
	for _, chapter := range result.Chapters {
		computeChapterStatus(chapter)
		result.OverallStatus = determineCombinedStatus(result.OverallStatus, chapter.Status)
	}
}

func (res *DefaultResultEngine) addMetaInformation(executionPlan *configuration.ExecutionPlan) {
	res.Result.Metadata.Version = currentResultVersion
	res.Result.Header.Name = executionPlan.Header.Name
	res.Result.Header.Version = executionPlan.Header.Version
	res.Result.Header.Date = time.Now().Format("2006-01-02 15:04")
	res.Result.Header.ToolVersion = helper.ToolVersion
}

func getChapter(chapters map[string]*v1.Chapter, requestedChapter *configuration.Chapter) *v1.Chapter {
	chapter, ok := chapters[requestedChapter.Id]
	if !ok {
		chapter = &v1.Chapter{
			Title:        requestedChapter.Title,
			Text:         requestedChapter.Text,
			Requirements: make(map[string]*v1.Requirement),
		}
		chapters[requestedChapter.Id] = chapter
	}
	return chapter
}

func getRequirement(requirements map[string]*v1.Requirement, requestedRequirement *configuration.Requirement) *v1.Requirement {
	req, ok := requirements[requestedRequirement.Id]
	if !ok {
		req = &v1.Requirement{
			Title:  requestedRequirement.Title,
			Text:   requestedRequirement.Text,
			Checks: make(map[string]*v1.Check),
		}
		requirements[requestedRequirement.Id] = req
	}
	return req
}

func getCheck(checks map[string]*v1.Check, requestedCheck *configuration.Check) *v1.Check {
	check, ok := checks[requestedCheck.Id]
	if !ok {
		check = &v1.Check{
			Title: requestedCheck.Title,
		}
		checks[requestedCheck.Id] = check
	}
	return check
}

func (res *DefaultResultEngine) createCheckResult(output *executor.Output) v1.CheckResult {
	result := v1.CheckResult{}
	result.Autopilot = output.Name
	result.Status = output.Status
	result.Reason = output.Reason
	for _, r := range output.Results {
		result.Results = append(result.Results, v1.AutopilotResult{
			Criterion:     common.MultilineString(r.Criterion),
			Fulfilled:     r.Fulfilled,
			Justification: common.MultilineString(r.Justification),
			Metadata:      r.Metadata,
		})
	}
	result.Outputs = output.Outputs
	result.Execution.Logs = output.Logs
	result.Execution.ErrorLogs = output.ErrLogs
	result.Execution.ExitCode = output.ExitCode
	if output.EvidencePath != "" {
		result.Execution.EvidencePath, _ = filepath.Rel(res.rootPath, output.EvidencePath)
	}
	return result
}

func (res *DefaultResultEngine) addItemResult(item *item.Result) {
	res.logger.Debug("Search for ", zap.Any("chapter", item.Config.Chapter))
	chapter := getChapter(res.Result.Chapters, &item.Config.Chapter)
	res.logger.Debug("Search for ", zap.Any("requirement", item.Config.Requirement))
	requirement := getRequirement(chapter.Requirements, &item.Config.Requirement)
	res.logger.Debug("Search for ", zap.Any("check", item.Config.Check))
	check := getCheck(requirement.Checks, &item.Config.Check)
	res.logger.Debug("Search for ", zap.Any("autopilot", item.Config.Autopilot))
	check.Evaluation = res.createCheckResult(item.Output)
	check.Type = item.Output.ExecutionType
	res.Result.Statistics.CountChecks++
	if item.Output.ExecutionType == Automation {
		res.Result.Statistics.CountAutomatedChecks++
		return
	}
	if check.Evaluation.Status == UNANSWERED {
		res.Result.Statistics.CountUnansweredChecks++
		return
	}
	if check.Evaluation.Status == v1.SKIPPED {
		res.Result.Statistics.CountSkippedChecks++
		return
	}
	res.Result.Statistics.CountManualChecks++
}
