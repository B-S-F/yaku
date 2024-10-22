import * as http from 'http'
import * as https from 'https'
import axios from 'axios'

const httpKeepAliveAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 128,
  timeout: 60000,
})

const httpsKeepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 128,
  timeout: 60000,
})

export const axiosInstance = axios.create({
  httpAgent: httpKeepAliveAgent,
  httpsAgent: httpsKeepAliveAgent,
})
