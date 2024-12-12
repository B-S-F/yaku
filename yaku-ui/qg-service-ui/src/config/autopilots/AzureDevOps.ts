// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Autopilot } from '~/types/Autopilot'
import {
  azureDevopsWorkItemsEvaluator,
  azureDevopsWorkItemsFetcher,
} from '../apps/azureDevopsWorkItems'

export const AzureDevOps: Autopilot = {
  name: 'Azure DevOps (ADO) autopilot',
  description:
    'Fetch tickets/work items from an ado project of your organization and subsequently check, whether their properties meet certain conditions.',
  apps: [azureDevopsWorkItemsFetcher, azureDevopsWorkItemsEvaluator],
}
