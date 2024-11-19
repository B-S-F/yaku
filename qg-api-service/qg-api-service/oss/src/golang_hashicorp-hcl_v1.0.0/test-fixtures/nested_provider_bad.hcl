# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

resource "aws" "web" {
  provider = "aws" {
    region = "us-west-2"
  }
}
