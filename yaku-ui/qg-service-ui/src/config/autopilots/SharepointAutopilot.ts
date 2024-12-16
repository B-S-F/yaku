// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { sharepointFetcher, sharepointEvaluator } from '~/config/apps'

export const SharepointAutopilot: Autopilot = {
  name: 'Sharepoint autopilot',
  description:
    'Evaluate file properties of files stored on SharePoint sites. If you want to evaluate custom properties of your SharePoint documents, make sure to set the SHAREPOINT_FETCHER_CUSTOM_PROPERTIES variable to the same values as the SharePoint fetcher was using.',
  apps: [sharepointFetcher, sharepointEvaluator],
}
