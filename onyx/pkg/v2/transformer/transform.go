package transformer

import "github.com/B-S-F/onyx/pkg/v2/model"

type Transformer interface {
	Transform(ep *model.ExecutionPlan) error
}
