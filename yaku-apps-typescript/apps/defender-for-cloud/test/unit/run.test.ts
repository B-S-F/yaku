import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import {
  parseFilterValues,
  prefixMatchAlerts,
  prefixMatchRecommendations,
  validateRequiredEnvVariables,
  Filter,
  getSecurityAlertsOnASubscription,
  getRecommendationsOnASubscription,
  getRecommendationsMetadataOnASubscription,
  run,
  getUnhealthyRecommendations,
  combineRecommendationAndMetadata,
} from '../../src/run'

import { mockedAlertsUnitTestsFirstSet } from '../fixtures/alerts'
import { 
  mockedHealthyRecommendation1,
  mockedHealthyRecommendation2,
  mockedUnhealthyRecommendation1,
  mockedUnhealthyRecommendation2,
  mockedRecommendationsUnitTestsFirstSet,
  mockedRecommendationsMetadataUnitTestsFirstSet,
  mockedRecommendationsMetadataUnitTestsSecondSet,
  mockedCombinedRecommendationsFirstSet,
  mockedRecommendationsMetadataMissingFields,
  mockedCombinedRecommendationsWithEmptyFields,
} from '../fixtures/recommendations'
import * as alertsRetriever from '../../src/alertsRetriever'
import * as recommendationsRetriever from '../../src/recommendationsRetriever'
import * as autopilotUtils from '@B-S-F/autopilot-utils'
import * as auth from '../../src/auth'

describe('Test "parseFilterValues()" from "run.ts"', () => {
  it('Should correctly split an "input filter string" and return the array of input values', () => {
    const inputFilterString = 'Kubernetes, critical, latest'
    const result = parseFilterValues(inputFilterString)
    expect(result).toEqual(['Kubernetes', 'critical', 'latest'])
  })

  it('Should correctly split an "input filter string" and return the array of input values even when newlines and multiple spaces are present', () => {
    const inputFilterString = `Kubernetes    ,   
                                    critical   ,      
                                    latest`
    const result = parseFilterValues(inputFilterString)
    expect(result).toEqual(['Kubernetes', 'critical', 'latest'])
  })

  it('Should return null when null is given as input', () => {
    const inputFilterString = null
    const result = parseFilterValues(inputFilterString)
    expect(result).toEqual(null)
  })

  it('Should return null when undefined is given as input', () => {
    const inputFilterString = undefined
    const result = parseFilterValues(inputFilterString)
    expect(result).toEqual(null)
  })

  it('Should return null when an empty string is given as input', () => {
    const inputFilterString = ''
    const result = parseFilterValues(inputFilterString)
    expect(result).toEqual(null)
  })
})

describe('Test "prefixMatchAlerts()" from "run.ts"', () => {
  it('Should return "true" if the field "properties.alertType" of the alert starts with the AlertType filter given as input', () => {
    const alert = { properties: { alertType: 'K8S_PrivilegedContainer' } }
    const filterValues = ['K8S_']
    const filterType = Filter.AlertType

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "true" if the field "properties.alertType" of the alert starts with one of the multiple AlertType filters given as input', () => {
    const alert = { properties: { alertType: 'K8S_PrivilegedContainer' } }
    const filterValues = ['VM_', 'SQL_', 'K8S_', 'DNS_']
    const filterType = Filter.AlertType

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "false" if the field "properties.alertType" of the alert does not start with one of the multiple AlertType filters given as input', () => {
    const alert = { properties: { alertType: 'K8S_PrivilegedContainer' } }
    const filterValues = ['VM_', 'SQL_', 'K8S.NODE_', 'DNS_']
    const filterType = Filter.AlertType

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(false)
  })

  it('Should return "true" if the field "properties.alertDisplayName" of the alert matches one of the multiple KeyWords filters given as input', () => {
    const alert = {
      properties: {
        alertDisplayName: 'Privileged container detected',
        description:
          "Kubernetes audit log analysis detected a new privileged container. A privileged container has access to the node's resources and breaks the isolation between containers. If compromised, an attacker can use the privileged container to gain access to the node.",
      },
    }
    const filterValues = ['xyz', 'ntaine', 'abc']
    const filterType = Filter.KeyWords

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "true" if the field "properties.description" of the alert matches one of the multiple KeyWords filters given as input', () => {
    const alert = {
      properties: {
        alertDisplayName: 'Privileged container detected',
        description:
          "Kubernetes audit log analysis detected a new privileged container. A privileged container has access to the node's resources and breaks the isolation between containers. If compromised, an attacker can use the privileged container to gain access to the node.",
      },
    }
    const filterValues = ['xyz', 'ompromise', 'abc']
    const filterType = Filter.KeyWords

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "false" if neither "properties.alertDisplayName" nor "properties.description" matches any of the multiple KeyWords filters given as input', () => {
    const alert = {
      properties: {
        alertDisplayName: 'Privileged container detected',
        description:
          "Kubernetes audit log analysis detected a new privileged container. A privileged container has access to the node's resources and breaks the isolation between containers. If compromised, an attacker can use the privileged container to gain access to the node.",
      },
    }
    const filterValues = [
      'xyz',
      'test string that does not exist in neither fields',
      'abc',
    ]
    const filterType = Filter.KeyWords

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(false)
  })

  it('Should return "true" if the field "properties.compromisedEntity" of the alert matches one of the multiple ResourceName filters given as input', () => {
    const alert = {
      properties: {
        compromisedEntity: 'top99-runner-aks-dev',
      },
    }
    const filterValues = ['xyz', 'unn', 'abc']
    const filterType = Filter.ResourceName

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "false" if the field "properties.compromisedEntity" of the alert does not match any of the multiple ResourceName filters given as input', () => {
    const alert = {
      properties: {
        compromisedEntity: 'top99-runner-aks-dev',
      },
    }
    const filterValues = [
      'xyz',
      'test string that does not match "properties.compromisedEntity"',
      'abc',
    ]
    const filterType = Filter.ResourceName

    const result = prefixMatchAlerts(alert, filterValues, filterType)

    expect(result).toEqual(false)
  })
})

describe('Test "prefixMatchRecommendations()" from "run.ts"', () => {
  it('Should return "true" if the field "properties.severity" of the recommendation matches one of the multiple Severity filters given as input', () => {
    const recommendation = {
      properties: {
        severity: 'Medium',
        },
    }
    const filterValues = ['Low', 'Medium']
    const filterType = Filter.Severity
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(true)
  })

  it('Should return "false" if the field "properties.severity" of the recommendation does not match any of the multiple Severity filters given as input', () => {
    const recommendation = {
      properties: {
        severity: 'Medium',
        },
    }
    const filterValues = ['Low', 'High']
    const filterType = Filter.Severity
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(false)
  })

  it('Should return "true" if at least one value from the field "properties.categories" of the recommendation matches one of the multiple Categories filters given as input', () => {
    const recommendation = {
      properties: {
        categories: ['Data'],
        },
    }
    const filterValues = ['Data', 'Networking', 'Unknown']
    const filterType = Filter.Categories
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(true)
  })

  it('Should return "false" if none of the values from the field "properties.categories" of the recommendation match any of the multiple Categories filters given as input', () => {
    const recommendation = {
      properties: {
        categories: ['Data'],
        },
    }
    const filterValues = ['Compute', 'Networking', 'Unknown']
    const filterType = Filter.Categories
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(false)
  })

  it('Should return "true" if at least one value from the field "properties.threats" of the recommendation matches one of the multiple Threats filters given as input', () => {
    const recommendation = {
      properties: {
        threats: [
          "DataExfiltration",
          "DataSpillage",
          "AccountBreach",
          "ElevationOfPrivilege"
        ],
      }
    }
    const filterValues = ['abc', 'DataSpillage', 'xyz']
    const filterType = Filter.Threats
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(true)
  })

  it('Should return "false" if none of the values from the field "properties.threats" of the recommendation matches any of the multiple Threats filters given as input', () => {
    const recommendation = {
      properties: {
        threats: [
          "DataExfiltration",
          "DataSpillage",
          "AccountBreach",
          "ElevationOfPrivilege"
        ],
      }
    }
    const filterValues = ['abc', '123', 'xyz']
    const filterType = Filter.Threats
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(false)
  })

  it('Should return "true" if the field "properties.displayName" of the recommendation matches one of the multiple KeyWords filters given as input', () => {
    const recommendation = {
      properties: {
        displayName: 'Azure DDoS Protection Standard should be enabled',
        description:
          'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
      },
    }
    const filterValues = ['xyz', 'Standard', 'abc']
    const filterType = Filter.KeyWords

    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "true" if the field "properties.description" of the recommendation matches one of the multiple KeyWords filters given as input', () => {
    const recommendation = {
      properties: {
        displayName: 'Azure DDoS Protection Standard should be enabled',
        description:
          'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
      },
    }
    const filterValues = ['xyz', 'network', 'abc']
    const filterType = Filter.KeyWords

    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)

    expect(result).toEqual(true)
  })

  it('Should return "false" if neither "properties.displayName" nor "properties.description" of the recommendation matches any of the multiple KeyWords filters given as input', () => {
    const recommendation = {
      properties: {
        displayName: 'Azure DDoS Protection Standard should be enabled',
        description:
          'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
      },
    }
    const filterValues = [
      'xyz',
      'test string that does not exist in neither fields',
      'abc',
    ]
    const filterType = Filter.KeyWords

    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)

    expect(result).toEqual(false)
  })

  it('Should return "true" if the field "properties.userImpact" of the recommendation matches one of the multiple UserImpact filters given as input', () => {
    const recommendation = {
      properties: {
        userImpact: 'Moderate',
        },
    }
    const filterValues = ['Moderate', 'Low', 'abc']
    const filterType = Filter.UserImpact
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(true)
  })

  it('Should return "false" if the field "properties.userImpact" of the recommendation does not match any of the multiple UserImpact filters given as input', () => {
    const recommendation = {
      properties: {
        userImpact: 'Moderate',
        },
    }
    const filterValues = ['Low', 'High']
    const filterType = Filter.UserImpact
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(false)
  })

  it('Should return "true" if the field "properties.implementationEffort" of the recommendation matches one of the multiple ImplementationEffort filters given as input', () => {
    const recommendation = {
      properties: {
        implementationEffort: 'Low',
        },
    }
    const filterValues = ['Moderate', 'Low', 'abc']
    const filterType = Filter.ImplementationEffort
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(true)
  })

  it('Should return "false" if the field "properties.implementationEffort" of the recommendation does not match any of the multiple ImplementationEffort filters given as input', () => {
    const recommendation = {
      properties: {
        implementationEffort: 'Low',
        },
    }
    const filterValues = ['xyz', 'High']
    const filterType = Filter.ImplementationEffort
    const result = prefixMatchRecommendations(recommendation, filterValues, filterType)
    expect(result).toEqual(false)
  })
})

describe('Test "validateRequiredEnvVariables()" from "run.ts"', () => {
  process.env.TENANT_ID = 'mockedTenantId'
  process.env.CLIENT_ID = 'mockedClientId'
  process.env.CLIENT_SECRET = 'mockedClientSecret'
  process.env.SUBSCRIPTION_ID = 'mockedSubscriptionId'

  it('Should throw an error if DATA_TYPE is not equal to "alerts" or "recommendations"', () => {
    process.env.DATA_TYPE = 'recommendation'
    expect(() => validateRequiredEnvVariables()).toThrowError(
      `Invalid value for DATA_TYPE environment variable! DATA_TYPE should be either 'alerts' or 'recommendations' and in this case is 'recommendation'`
    )
  })

  it('Should return default DATA_TYPE "alerts" if DATA_TYPE is undefined', () => {
    delete process.env.DATA_TYPE
    const result = validateRequiredEnvVariables()
    expect(result).toEqual('alerts')
  })

  it('Should return default DATA_TYPE "alerts" if DATA_TYPE is an empty string', () => {
    process.env.DATA_TYPE = ''
    const result = validateRequiredEnvVariables()
    expect(result).toEqual('alerts')
  })

  it('Should throw an error if TENANT_ID is undefined', () => {
    delete process.env.TENANT_ID
    expect(() => validateRequiredEnvVariables()).toThrowError(
      'Please provide TENANT_ID in the environmental variables before running the autopilot'
    )
  })

  it('Should throw an error if CLIENT_ID is empty string', () => {
    process.env.TENANT_ID = 'mockedTenantId'
    process.env.CLIENT_ID = ''
    expect(() => validateRequiredEnvVariables()).toThrowError(
      'Please provide CLIENT_ID in the environmental variables before running the autopilot'
    )
  })

  it('Should throw an error if CLIENT_SECRET is undefined', () => {
    process.env.CLIENT_ID = 'mockedClientId'
    delete process.env.CLIENT_SECRET
    expect(() => validateRequiredEnvVariables()).toThrowError(
      'Please provide CLIENT_SECRET in the environmental variables before running the autopilot'
    )
  })

  it('Should throw an error if SUBSCRIPTION_ID is empty string', () => {
    process.env.CLIENT_SECRET = 'mockedClientSecret'
    process.env.SUBSCRIPTION_ID = ''
    expect(() => validateRequiredEnvVariables()).toThrowError(
      'Please provide SUBSCRIPTION_ID in the environmental variables before running the autopilot'
    )
  })
})

describe('Test "getSecurityAlertsOnASubscription()" from "run.ts"', async () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of alerts if response status is 200', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedSecurityAlertsSpy = vi.spyOn(
      alertsRetriever,
      'getDefenderForCloudAlerts'
    )
    const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
    mockedSecurityAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

    const result = await getSecurityAlertsOnASubscription()

    expect(result).toEqual(mockedSecurityAlerts)
  })

  it('Should throw a specific error from "generateAzureAccessToken()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    mockedTokenSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure access token does not have status code 200. Status code: 400'
      )
    )

    expect(getSecurityAlertsOnASubscription()).rejects.toThrow(
      'Request for Azure access token does not have status code 200. Status code: 400'
    )
  })

  it('Should throw a specific error from "getDefenderForCloudAlerts()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedSecurityAlertsSpy = vi.spyOn(
      alertsRetriever,
      'getDefenderForCloudAlerts'
    )
    mockedSecurityAlertsSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure alerts does not have status code 200. Status code: 400'
      )
    )

    expect(getSecurityAlertsOnASubscription()).rejects.toThrow(
      'Request for Azure alerts does not have status code 200. Status code: 400'
    )
  })
})

describe('Test "getRecommendationsOnASubscription()" from "run.ts"', async () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of recommendations if response status is 200', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedRecommendationsSpy = vi.spyOn(
      recommendationsRetriever,
      'getDefenderForCloudRecommendations'
    )
    const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
    mockedRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

    const result = await getRecommendationsOnASubscription()

    expect(result).toEqual(mockedRecommendations)
  })

  it('Should throw a specific error from "generateAzureAccessToken()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    mockedTokenSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure access token does not have status code 200. Status code: 400'
      )
    )

    expect(getRecommendationsOnASubscription()).rejects.toThrow(
      'Request for Azure access token does not have status code 200. Status code: 400'
    )
  })

  it('Should throw a specific error from "getDefenderForCloudRecommendations()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedRecommendationsSpy = vi.spyOn(
      recommendationsRetriever,
      'getDefenderForCloudRecommendations'
    )
    mockedRecommendationsSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure recommendations does not have status code 200. Status code: 400'
      )
    )

    expect(getRecommendationsOnASubscription()).rejects.toThrow(
      'Request for Azure recommendations does not have status code 200. Status code: 400'
    )
  })
})

describe('Test "getRecommendationsMetadataOnASubscription()" from "run.ts"', async () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of recommendations metadata if response status is 200', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedRecommendationsMetadataSpy = vi.spyOn(
      recommendationsRetriever,
      'getDefenderForCloudRecommendationsMetadata'
    )
    const mockedMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
    mockedRecommendationsMetadataSpy.mockResolvedValueOnce(mockedMetadata)

    const result = await getRecommendationsMetadataOnASubscription()

    expect(result).toEqual(mockedMetadata)
  })

  it('Should throw a specific error from "generateAzureAccessToken()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    mockedTokenSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure access token does not have status code 200. Status code: 400'
      )
    )

    expect(getRecommendationsMetadataOnASubscription()).rejects.toThrow(
      'Request for Azure access token does not have status code 200. Status code: 400'
    )
  })

  it('Should throw a specific error from "getDefenderForCloudRecommendationsMetadata()" if status is not 200 ', async () => {
    const mockedTokenSpy = vi.spyOn(auth, 'generateAzureAccessToken')
    const mockedToken = 'mockedToken'
    mockedTokenSpy.mockResolvedValueOnce(mockedToken)

    const mockedRecommendationsMetadataSpy = vi.spyOn(
      recommendationsRetriever,
      'getDefenderForCloudRecommendationsMetadata'
    )
    mockedRecommendationsMetadataSpy.mockRejectedValueOnce(
      new Error(
        'Request for Azure recommendations metadata does not have status code 200. Status code: 400'
      )
    )

    expect(getRecommendationsMetadataOnASubscription()).rejects.toThrow(
      'Request for Azure recommendations metadata does not have status code 200. Status code: 400'
    )
  })
})

describe('Test "getUnhealthyRecommendations()" from "run.ts"', () => {
  it('Should return an array of all unhealthy recommendations', () => {
    const mockedMixedRecommendations = [
      mockedUnhealthyRecommendation1,
      mockedUnhealthyRecommendation2,
      mockedHealthyRecommendation1,
      mockedHealthyRecommendation2
    ]

    const mockedUnhealthyRecommendations: any[] = [
      mockedUnhealthyRecommendation1,
      mockedUnhealthyRecommendation2
    ]
    
    const result = getUnhealthyRecommendations(mockedMixedRecommendations)
    expect(result).toEqual(mockedUnhealthyRecommendations)
  })

  it('Should return an empty map if there are no unhealthy recommendations', () => {
    const mockedMixedRecommendations = [
      mockedHealthyRecommendation1,
      mockedHealthyRecommendation2
    ]

    const result = getUnhealthyRecommendations(mockedMixedRecommendations)
    expect(result).toEqual([])
  })
})

describe('Test "combineRecommendationAndMetadata()" from "run.ts"', () => {
  it('Should return a list of merged recommendations if the metadata input includes items matching the name of any input recommendations', () => {
    const copyMockedRecommendationsUnitTestsFirstSet = JSON.parse(JSON.stringify(mockedRecommendationsUnitTestsFirstSet))
    const result = combineRecommendationAndMetadata(copyMockedRecommendationsUnitTestsFirstSet, mockedRecommendationsMetadataUnitTestsFirstSet)
    expect(result).toEqual(mockedCombinedRecommendationsFirstSet)
  })

  it('Should return a list of unchanged recommendations if the metadata input does not include items matching the name of any input recommendations', () => {
    const copyMockedRecommendationsUnitTestsFirstSet = JSON.parse(JSON.stringify(mockedRecommendationsUnitTestsFirstSet))
    const result = combineRecommendationAndMetadata(copyMockedRecommendationsUnitTestsFirstSet, mockedRecommendationsMetadataUnitTestsSecondSet)
    expect(result).toEqual(mockedRecommendationsUnitTestsFirstSet)
  })

  it('Should return a list of unchanged recommendations if the metadata input is empty', () => {
    const copyMockedRecommendationsUnitTestsFirstSet = JSON.parse(JSON.stringify(mockedRecommendationsUnitTestsFirstSet))
    const result = combineRecommendationAndMetadata(copyMockedRecommendationsUnitTestsFirstSet, [])
    expect(result).toEqual(mockedRecommendationsUnitTestsFirstSet)
  })

  it('Should return an empty list if the input recommendations list is empty and the metadata input is non-empty', () => {
    const result = combineRecommendationAndMetadata([], mockedRecommendationsMetadataUnitTestsFirstSet)
    expect(result).toEqual([])
  })

  it('Should return recommendations with an empty properties field if the property is absent from the metadata properties', () => {
    const copyMockedRecommendationsUnitTestsFirstSet = JSON.parse(JSON.stringify(mockedRecommendationsUnitTestsFirstSet))
    const result = combineRecommendationAndMetadata(copyMockedRecommendationsUnitTestsFirstSet, mockedRecommendationsMetadataMissingFields)
    expect(result).toEqual(mockedCombinedRecommendationsWithEmptyFields)
  })
})

describe('Test "run()" from "run.ts"', async () => {
  process.exit = vi.fn()

  beforeEach(() => {
    delete process.env.TENANT_ID
    delete process.env.CLIENT_ID
    delete process.env.CLIENT_SECRET
    delete process.env.SUBSCRIPTION_ID

    delete process.env.ALERT_TYPE_FILTER
    delete process.env.KEY_WORDS_FILTER
    delete process.env.RESOURCE_NAME_FILTER
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Environment variables validation', () => {
    describe('Undefined required environment variables', () => {
      beforeEach(() => {
        vi.stubEnv('TENANT_ID', 'mockedTenantId')
        vi.stubEnv('CLIENT_ID', 'mockedClientId')
        vi.stubEnv('CLIENT_SECRET', 'mockedClientSecret')
        vi.stubEnv('SUBSCRIPTION_ID', 'mockedSubscriptionId')
      })

      it.each([
        { name: 'TENANT_ID' },
        { name: 'CLIENT_ID' },
        { name: 'CLIENT_SECRET' },
        { name: 'SUBSCRIPTION_ID' },
      ])(
        'Should set status FAILED when $name is not set',
        async (envVariable) => {
          delete process.env[`${envVariable.name}`]
          const spyStatus = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setStatus'
          )
          const spyReason = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setReason'
          )

          await run()

          expect(spyStatus).toHaveBeenCalledWith('FAILED')
          expect(spyReason).toHaveBeenCalledWith(
            'Please provide ' +
              `${envVariable.name} ` +
              'in the environmental variables before running the autopilot'
          )
        }
      )
      it('Should set status FAILED when no required environment variables are set', async () => {
        delete process.env.TENANT_ID
        delete process.env.CLIENT_ID
        delete process.env.CLIENT_SECRET
        delete process.env.SUBSCRIPTION_ID
        const spyStatus = vi.spyOn(
          autopilotUtils.AppOutput.prototype,
          'setStatus'
        )
        const spyReason = vi.spyOn(
          autopilotUtils.AppOutput.prototype,
          'setReason'
        )

        await run()

        expect(spyStatus).toHaveBeenCalledWith('FAILED')
        expect(spyReason).toHaveBeenCalledWith(
          'Please provide TENANT_ID in the environmental variables before running the autopilot'
        )
      })
    })

    describe('Required environment variables are empty strings', () => {
      beforeEach(() => {
        vi.stubEnv('TENANT_ID', 'mockedTenantId')
        vi.stubEnv('CLIENT_ID', 'mockedClientId')
        vi.stubEnv('CLIENT_SECRET', 'mockedClientSecret')
        vi.stubEnv('SUBSCRIPTION_ID', 'mockedSubscriptionId')
      })

      afterEach(() => {
        vi.unstubAllEnvs()
        vi.clearAllMocks()
      })

      it.each([
        {
          name: 'TENANT_ID',
          value: '',
        },
        {
          name: 'CLIENT_ID',
          value: '',
        },
        {
          name: 'CLIENT_SECRET',
          value: '',
        },
        {
          name: 'SUBSCRIPTION_ID',
          value: '',
        },
      ])(
        'Should set status FAILED when $name is set, but empty',
        async (envVariable) => {
          delete process.env[`${envVariable.name}`]
          vi.stubEnv(`${envVariable.name}`, envVariable.value)
          const spyStatus = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setStatus'
          )
          const spyReason = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setReason'
          )

          await run()

          expect(spyStatus).toHaveBeenCalledWith('FAILED')
          expect(spyReason).toHaveBeenCalledWith(
            'Please provide ' +
              `${envVariable.name} ` +
              'in the environmental variables before running the autopilot'
          )
        }
      )
    })
  })

  describe('Filters configuration for alerts', () => {
    beforeEach(() => {
      vi.stubEnv('TENANT_ID', 'mockedTenantId')
      vi.stubEnv('CLIENT_ID', 'mockedClientId')
      vi.stubEnv('CLIENT_SECRET', 'mockedClientSecret')
      vi.stubEnv('SUBSCRIPTION_ID', 'mockedSubscriptionId')
      vi.stubEnv('ALERT_TYPE_FILTER', 'K8S_PrivilegedContainer, Kubernetes')
      vi.stubEnv('KEY_WORDS_FILTER', 'K8S, suspicious, container')
      vi.stubEnv('RESOURCE_NAME_FILTER', 'K8S, dev1aks')
      vi.stubEnv('DATA_TYPE', 'alerts')
    })
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.clearAllMocks()
      vi.restoreAllMocks()
    })

    it('Should return status RED with 2 retrieved alerts when there are zero filters', async () => {
      delete process.env.ALERT_TYPE_FILTER
      delete process.env.KEY_WORDS_FILTER
      delete process.env.RESOURCE_NAME_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 2 alerts based on given filters'
      )
    })

    it('Should return status RED with 1 retrieved alert when there is ALERT_TYPE_FILTER filter', async () => {
      delete process.env.KEY_WORDS_FILTER
      delete process.env.RESOURCE_NAME_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 alerts based on given filters'
      )
    })

    it('Should return status RED with 2 retrieved alerts when there is KEY_WORDS_FILTER filter', async () => {
      delete process.env.ALERT_TYPE_FILTER
      delete process.env.RESOURCE_NAME_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 2 alerts based on given filters'
      )
    })

    it('Should return status RED with 1 retrieved alert when there is RESOURCE_NAME_FILTER filter', async () => {
      delete process.env.ALERT_TYPE_FILTER
      delete process.env.KEY_WORDS_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 alerts based on given filters'
      )
    })

    it('Should return status RED with 1 retrieved alert when there are ALERT_TYPE_FILTER and KEY_WORDS_FILTER filters', async () => {
      delete process.env.RESOURCE_NAME_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 alerts based on given filters'
      )
    })

    it('Should return status GREEN with 0 retrieved alerts when there are all the filters', async () => {
      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudAlertsSpy = vi.spyOn(
        alertsRetriever,
        'getDefenderForCloudAlerts'
      )
      const mockedSecurityAlerts = mockedAlertsUnitTestsFirstSet
      getDefenderForCloudAlertsSpy.mockResolvedValueOnce(mockedSecurityAlerts)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('GREEN')
      expect(spyReason).toHaveBeenCalledWith(
        'No alerts found based on given filters'
      )
    })
  })

  describe('Filters configuration for recommendations', () => {
    beforeEach(() => {
      vi.stubEnv('TENANT_ID', 'mockedTenantId')
      vi.stubEnv('CLIENT_ID', 'mockedClientId')
      vi.stubEnv('CLIENT_SECRET', 'mockedClientSecret')
      vi.stubEnv('SUBSCRIPTION_ID', 'mockedSubscriptionId')
      vi.stubEnv('SEVERITY_FILTER', 'High')
      vi.stubEnv('KEY_WORDS_FILTER', 'network, virtual')
      vi.stubEnv('CATEGORIES_FILTER', 'Networking')
      vi.stubEnv('THREATS_FILTER', 'ThreatResistance, DenialOfService, DataSpillage')
      vi.stubEnv('USER_IMPACT_FILTER', 'Moderate')
      vi.stubEnv('IMPLEMENTATION_EFFORT_FILTER', 'Moderate')
      vi.stubEnv('DATA_TYPE', 'recommendations')
    })
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.clearAllMocks()
      vi.restoreAllMocks()
    })

    it('Should return status RED with 2 retrieved unhealthy recommendations when there are zero filters', async () => {
      delete process.env.SEVERITY_FILTER
      delete process.env.KEY_WORDS_FILTER
      delete process.env.CATEGORIES_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.USER_IMPACT_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 2 security recommendations based on given filters'
      )
    })

    it('Should return status RED with 1 retrieved unhealthy recommendation when there is SEVERITY_FILTER filter', async () => {
      delete process.env.KEY_WORDS_FILTER
      delete process.env.CATEGORIES_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.USER_IMPACT_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 security recommendations based on given filters'
      )
    }) 

    it('Should return status RED with 1 retrieved unhealthy recommendation when there is KEY_WORDS_FILTER filter', async () => {
      delete process.env.SEVERITY
      delete process.env.CATEGORIES_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.USER_IMPACT_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 security recommendations based on given filters'
      )
    }) 

    it('Should return status RED with 1 retrieved unhealthy recommendation when there is CATEGORIES_FILTER filter', async () => {
      delete process.env.KEY_WORDS_FILTER
      delete process.env.SEVERITY_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.USER_IMPACT_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 security recommendations based on given filters'
      )
    })

    it('Should return status RED with 2 retrieved unhealthy recommendations when there is THREATS_FILTER filter', async () => {
      delete process.env.KEY_WORDS_FILTER
      delete process.env.SEVERITY_FILTER
      delete process.env.CATEGORIES_FILTER
      delete process.env.USER_IMPACT_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 2 security recommendations based on given filters'
      )
    })

    it('Should return status RED with 1 retrieved unhealthy recommendation when there is USER_IMPACT_FILTER filter', async () => {
      delete process.env.SEVERITY_FILTER
      delete process.env.KEY_WORDS_FILTER
      delete process.env.CATEGORIES_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.IMPLEMENTATION_EFFORT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 1 security recommendations based on given filters'
      )
    }) 

    it('Should return status RED with 2 retrieved unhealthy recommendations when there is IMPLEMENTATION_EFFORT_FILTER filter', async () => {
      delete process.env.SEVERITY_FILTER
      delete process.env.KEY_WORDS_FILTER
      delete process.env.CATEGORIES_FILTER
      delete process.env.THREATS_FILTER
      delete process.env.USER_IMPACT_FILTER

      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        'Retrieved 2 security recommendations based on given filters'
      )
    }) 

    it('Should return status GREEN with 0 retrieved unhealthy recommendations when all the filter are present', async () => {
      const generateAzureAccessTokenSpy = vi.spyOn(
        auth,
        'generateAzureAccessToken'
      )
      const mockedToken = 'mockedToken'
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)

      const getDefenderForCloudRecommendationsSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendations'
      )
      const mockedRecommendations = mockedRecommendationsUnitTestsFirstSet
      getDefenderForCloudRecommendationsSpy.mockResolvedValueOnce(mockedRecommendations)

      const getDefenderForCloudRecommendationsMetadataSpy = vi.spyOn(
        recommendationsRetriever,
        'getDefenderForCloudRecommendationsMetadata'
      )
      
      generateAzureAccessTokenSpy.mockResolvedValueOnce(mockedToken)
      const mockedRecommendationsMetadata = mockedRecommendationsMetadataUnitTestsFirstSet
      getDefenderForCloudRecommendationsMetadataSpy.mockResolvedValueOnce(mockedRecommendationsMetadata)

      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )

      await run()

      expect(spyStatus).toHaveBeenCalledWith('GREEN')
      expect(spyReason).toHaveBeenCalledWith(
        'No security recommendations found based on given filters'
      )
    }) 
  })
})
