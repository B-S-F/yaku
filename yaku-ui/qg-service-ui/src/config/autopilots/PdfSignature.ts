// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { artifactoryFetcher, pdfSignatureEvaluator } from '~/config/apps'

export const PdfSignature: Autopilot = {
  name: 'PDF Signature Evaluator autopilot',
  description:
    'An evaluator that checks the integrity of PDF signatures and optionally matches the generated list of signers against a predefined expected list of signers.',
  apps: [artifactoryFetcher, pdfSignatureEvaluator],
}
