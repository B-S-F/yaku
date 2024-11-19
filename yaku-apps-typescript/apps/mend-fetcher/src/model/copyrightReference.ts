// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export class CopyrightReference {
  constructor(
    public type: string,
    public copyright: string,
    public author: string,
    public referenceInfo: string,
    public startYear?: string,
    public endYear?: string,
  ) {}
}
