// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Result<T, E> = { ok: true; result?: T } | { ok: false; err: E }
