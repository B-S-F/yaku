import { handleStandardParams } from '../common.js'
import { ApiClient } from '@B-S-F/yaku-client-lib'

export async function info(client: ApiClient, options: any) {
  handleStandardParams(client)
  const info = await client.getServiceInfo()
  if (options.only && options.only in info) {
    console.log((info as any)[options.only])
  } else {
    console.log(JSON.stringify(info, null, 2))
  }
}
