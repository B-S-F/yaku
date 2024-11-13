import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

export function about(options: any) {
  if (options.sbom) {
    const dirname = new URL('.', import.meta.url).pathname
    const sbom = JSON.parse(
      fs.readFileSync(path.join(dirname, config.sbomFileName)).toString('utf-8')
    )
    console.log(JSON.stringify(sbom, null, 2))
  } else {
    console.log('Yaku Client CLI\n')
    console.log('Copyright Bosch Software Flow\n')
    console.log(
      `Use option '--sbom' to get further details on used open source components`
    )
  }
}
