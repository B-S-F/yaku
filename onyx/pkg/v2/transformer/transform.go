// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package transformer

import "github.com/B-S-F/yaku/onyx/pkg/v2/model"

type Transformer interface {
	Transform(ep *model.ExecutionPlan) error
}
