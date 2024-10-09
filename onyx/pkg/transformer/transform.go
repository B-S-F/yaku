package transformer

import "github.com/B-S-F/yaku/onyx/pkg/configuration"

type Transformer interface {
	Transform(ep *configuration.ExecutionPlan) error
}
