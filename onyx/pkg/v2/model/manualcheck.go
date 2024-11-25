// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package model

import (
	conf "github.com/B-S-F/yaku/onyx/pkg/configuration"
)

type ManualCheck struct {
	Item
	Manual conf.Manual
}

type ManualResult struct {
	Status string
	Reason string
}
