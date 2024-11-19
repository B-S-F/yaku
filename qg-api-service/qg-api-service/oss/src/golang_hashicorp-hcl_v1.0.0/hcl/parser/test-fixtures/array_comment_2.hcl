# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

provisioner "remote-exec" {
  scripts = [
    "${path.module}/scripts/install-consul.sh" // missing comma
    "${path.module}/scripts/install-haproxy.sh"
  ]
}
