// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package model

import "fmt"

type UserError struct {
	err    error
	reason string
}

func NewUserErr(err error, reason string) UserError {
	return UserError{err: err, reason: reason}
}

func (u UserError) Error() string {
	return fmt.Sprintf("%s: %s", u.reason, u.err.Error())
}

func (u UserError) Reason() string {
	return u.reason
}
