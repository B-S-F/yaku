// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package parser

import (
	"testing"
)

func TestPosError_impl(t *testing.T) {
	var _ error = new(PosError)
}
