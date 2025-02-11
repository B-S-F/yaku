// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export class ProjectDTO {
  constructor(
    public uuid: string,
    public name: string,
    public path: string,
    public productName: string,
    public productUuid: string,
  ) {}
}
