# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

# should error, but not crash
resource "template_file" "cloud_config" {
  template = "$file("${path.module}/some/path")"
}
