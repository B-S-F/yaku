// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export class LicenseReference {
  constructor(
    public uuid: string,
    public type: string,
    public liabilityReference: string,
    public information: string,
  ) {}
}
