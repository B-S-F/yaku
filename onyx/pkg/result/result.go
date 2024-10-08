package result

import (
	"github.com/B-S-F/onyx/pkg/configuration"
	"github.com/B-S-F/onyx/pkg/executor"
	"github.com/B-S-F/onyx/pkg/item"
	v1 "github.com/B-S-F/onyx/pkg/result/v1"
)

const (
	ERROR      = "ERROR"
	RED        = "RED"
	YELLOW     = "YELLOW"
	GREEN      = "GREEN"
	UNANSWERED = "UNANSWERED"
)

type ResultEngine interface {
	CreateNewResult(executionPlan *configuration.ExecutionPlan, itemResults *[]item.Result)
	AppendFinalizerResult(finalizerResult *executor.Output)
	GetResult() *v1.Result
}
