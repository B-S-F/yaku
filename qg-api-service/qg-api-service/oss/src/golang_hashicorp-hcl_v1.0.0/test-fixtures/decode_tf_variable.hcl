# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

variable "foo" {
    default = "bar"
    description = "bar"
}

variable "amis" {
    default = {
        east = "foo"
    }
}
