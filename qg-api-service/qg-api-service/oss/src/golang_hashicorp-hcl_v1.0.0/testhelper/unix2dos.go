// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package testhelper

import (
	"runtime"
	"strings"
)

// Converts the line endings when on Windows
func Unix2dos(unix string) string {
	if runtime.GOOS != "windows" {
		return unix
	}

	return strings.Replace(unix, "\n", "\r\n", -1)
}
