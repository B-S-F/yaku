package transformer

import (
	"github.com/B-S-F/onyx/pkg/parameter"
	"github.com/B-S-F/onyx/pkg/v2/model"
	"github.com/pkg/errors"
)

type autopilotSkipper struct {
	execParams parameter.ExecutionParameter
}

func NewAutopilotSkipper(execParams parameter.ExecutionParameter) Transformer {
	return &autopilotSkipper{
		execParams: execParams,
	}
}

func (d autopilotSkipper) Transform(ep *model.ExecutionPlan) error {
	if d.execParams.CheckIdentifier == "" {
		return nil
	}

	checkIdentifier := d.execParams.ParseCheckId()
	var found bool

	for i := range ep.AutopilotChecks {
		autopilotCheck := ep.AutopilotChecks[i]
		found = isCheckItem(autopilotCheck.Chapter.Id, autopilotCheck.Requirement.Id, autopilotCheck.Check.Id, checkIdentifier)
	}

	for i := range ep.ManualChecks {
		manualCheck := &ep.ManualChecks[i]
		if !isCheckItem(manualCheck.Chapter.Id, manualCheck.Requirement.Id, manualCheck.Check.Id, checkIdentifier) {
			if manualCheck.Manual.Status != "UNANSWERED" && manualCheck.Manual.Status != "NA" {
				manualCheck.Manual.Status = "SKIPPED"
				manualCheck.Manual.Reason = "Skipped due to single check execution"
			}
		} else if manualCheck.Manual.Status != "" {
			return errors.Errorf("Check '%s_%s_%s' is a manual check, skipping the others does not make sense", checkIdentifier.Chapter, checkIdentifier.Requirement, checkIdentifier.Check)
		} else {
			found = true
		}
	}

	if !found {
		return errors.Errorf("Check '%s_%s_%s' not found", checkIdentifier.Chapter, checkIdentifier.Requirement, checkIdentifier.Check)
	}

	ep.Finalize = &model.Finalize{}
	return nil
}

func isCheckItem(chapterID string, requirementID string, checkID string, checkIdentifier parameter.CheckIdentifier) bool {
	return chapterID == checkIdentifier.Chapter && requirementID == checkIdentifier.Requirement && checkID == checkIdentifier.Check
}
