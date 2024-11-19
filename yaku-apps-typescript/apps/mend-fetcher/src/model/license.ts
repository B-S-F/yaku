// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { LicenseReference } from './licenseReference.js'

export class License {
  constructor(
    public uuid: string,
    public name: string,
    public assignedByUser: boolean,
    public licenseReferences: LicenseReference[],
  ) {}
}
