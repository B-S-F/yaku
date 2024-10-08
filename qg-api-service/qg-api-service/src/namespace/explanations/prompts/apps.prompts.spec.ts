import { getAutoPilotInfo, getAutoPilotsInfo } from './apps.prompts'

const autopilots = {
  known_autopilot: {
    context:
      'Splunk is a software platform that helps organizations collect, analyze, and visualize machine-generated data for monitoring and gaining insights into their systems. Do you use Splunk for data collection and analysis and need to collect reports from there and check them before releasing the new software version? You can now easily use the Splunk Fetcher for that, which uses defined search queries to get data from a Splunk server and stores it. ',
  },
  unknown: {
    context:
      'Nothing is known about this autopilot, you must let the user know that it is an unknown autopilot. If the input is something that is familiar a short answer can be provided all while letting the user know that its not certain, otherwise tell the user that currently this autopilot is not yet support for this AI feature.',
  },
}

describe('GetAutoPilotInfo', () => {
  it('should return autopilot information for known autopilot', () => {
    const autopilot = 'splunk-fetcher'
    const expectedAutoPilotInfo = autopilots.known_autopilot
    const autoPilotInfo = getAutoPilotInfo(autopilot)

    expect(autoPilotInfo.context).toEqual(expectedAutoPilotInfo.context)
  })

  it('should return default information for unknown autopilot', () => {
    const autopilot = 'unknown_autopilot'
    const expectedAutoPilotInfo = autopilots.unknown
    const autoPilotInfo = getAutoPilotInfo(autopilot)

    expect(autoPilotInfo.context).toEqual(expectedAutoPilotInfo.context)
  })
})

describe('GetAutoPilotsInfo', () => {
  it('should return all autopilots referenced in a script', () => {
    const script = `
    metadata:
  version: 'v1'
header:
  name: MVP - Initial Release
  version: '0.9'

autopilots:
  docupedia-filecheck:
    run: |
      set -ex
      docupedia-fetcher
    env:
      DOCUPEDIA_SCHEME_ID: 
      DOCUPEDIA_USER: 
  sharepoint-pdf-signature-check:
    run: |
      set -ex
      sharepoint-fetcher
      pdf-signature-evaluator --pdf-location=.
    env:
      SHAREPOINT_FETCHER_PROJECT_SITE: https://example.com/sites/msteams_12345678
      SHAREPOINT_FETCHER_IS_CLOUD: 'True'
`

    const autoPilotsInfo = getAutoPilotsInfo(script)

    expect(autoPilotsInfo).toHaveLength(3)
    expect(autoPilotsInfo[0].name).toEqual('docupedia-fetcher')
    expect(autoPilotsInfo[1].name).toEqual('pdf-signature-evaluator')
    expect(autoPilotsInfo[2].name).toEqual('sharepoint-fetcher')
  })
})
