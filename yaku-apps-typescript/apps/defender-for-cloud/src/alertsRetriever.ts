import axios from 'axios'

export const getDefenderForCloudAlerts = async (
  token: string,
  subscriptionId: string,
) => {
  const baseUrl =
    process.env.IS_INTEGRATION_TEST === 'true'
      ? 'http://localhost:8080'
      : 'https://management.azure.com'
  const urlQueryParameters =
    process.env.IS_INTEGRATION_TEST === 'true' ? '' : '?api-version=2022-01-01'
  let URL =
    baseUrl +
    `/subscriptions/${subscriptionId}/providers/Microsoft.Security/alerts` +
    urlQueryParameters

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  }

  let fetchNextPage = false
  let alerts: any[] = []
  try {
    do {
      const response = await axios.get(URL, config)
      if (response.status === 200) {
        alerts = alerts.concat(response.data.value)
        if (response.data.nextLink) {
          URL = response.data.nextLink
          fetchNextPage = true
        } else {
          fetchNextPage = false
        }
      }
    } while (fetchNextPage)
  } catch (error: any) {
    console.log('Error response: ')
    console.log(error.response.data)
    throw new Error(
      `Request for Azure alerts does not have status code 200. Status code: ${error.response.status}`,
    )
  }
  return alerts
}
