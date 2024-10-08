package transformer

import (
	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/parameter"
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

func (d autopilotSkipper) Transform(ep *configuration.ExecutionPlan) error {
	if d.execParams.CheckIdentifier == "" {
		return nil
	}
	checkIdentifier := d.execParams.ParseCheckId()
	found := false
	for index := range ep.Items {
		if skipItem(ep.Items[index], checkIdentifier) {
			if ep.Items[index].Manual.Status != "UNANSWERED" && ep.Items[index].Manual.Status != "NA" {
				ep.Items[index].Manual.Status = "SKIPPED"
				ep.Items[index].Manual.Reason = "Skipped due to single check execution"
			}
		} else if ep.Items[index].Manual.Status != "" {
			return errors.Errorf(
				"Check '%s_%s_%s' is a manual check, skipping the others does not make sense",
				checkIdentifier.Chapter,
				checkIdentifier.Requirement,
				checkIdentifier.Check,
			)
		} else {
			found = true
		}
	}
	if !found {
		return errors.Errorf(
			"Check '%s_%s_%s' not found",
			checkIdentifier.Chapter,
			checkIdentifier.Requirement,
			checkIdentifier.Check,
		)
	}
	ep.Finalize = configuration.Item{}
	return nil
}

func skipItem(item configuration.Item, checkIdentifier parameter.CheckIdentifier) bool {
	if item.Chapter.Id != checkIdentifier.Chapter {
		return true
	}
	if item.Requirement.Id != checkIdentifier.Requirement {
		return true
	}
	if item.Check.Id != checkIdentifier.Check {
		return true
	}
	return false
}
