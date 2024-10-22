import { readFile } from 'fs/promises'

export const readJson = async (filePath: string): Promise<any> => {
  try {
    const data = await readFile(filePath, 'utf-8')
    const stringStrippedData = data.replace(/"([^"]*?)":/g, (_, group1) => {
      return `"${group1.replace(/\s/g, '_')}"` + ':'
    })

    return JSON.parse(stringStrippedData)
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File ${filePath} does not exist`)
    }
    throw new Error(
      `File ${filePath} could not be parsed, failed with error: ${error}`
    )
  }
}
