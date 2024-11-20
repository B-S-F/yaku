// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package transformer

import "github.com/B-S-F/yaku/onyx/pkg/configuration"

type Transformer interface {
	Transform(ep *configuration.ExecutionPlan) error
}
