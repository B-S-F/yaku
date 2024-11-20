# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

output {
  one = "${replace(var.sub_domain, ".", "\\.")}"
  two = "${replace(var.sub_domain, ".", "\\\\.")}"
  many = "${replace(var.sub_domain, ".", "\\\\\\\\.")}"
}
