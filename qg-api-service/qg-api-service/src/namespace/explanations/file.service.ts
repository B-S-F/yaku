import { File, ParsedQGConfig, QGConfig } from './types'
import * as yaml from 'yaml'

export const parseRunFiles = (
  files: File[],
  selectedChapter: string,
  selectedRequirement: string,
  selectedCheck: string
): File[] | null => {
  const parsedFiles: File[] = []

  const parsedQGConfig = parseQGConfig(
    (files.find((file) => file.filename === 'qg-config.yaml')
      ?.content as string) ?? '',
    selectedChapter,
    selectedRequirement,
    selectedCheck
  )
  //if files are specifed in the config, they are for sure used in the script, so we add them
  if (parsedQGConfig.run.config.length > 0) {
    parsedQGConfig.run.config.forEach((configFile) => {
      const file = files.find((file) => file.filename === configFile)
      if (file) {
        parsedFiles.push(file)
      }
    })
  } else {
    //we are unsure what files are used in the script, so we search the script for file references
    files.forEach((file) => {
      if (
        file.filename !== 'qg-config.yaml' &&
        fileUsedInScript(file, yaml.stringify(parsedQGConfig.run))
      ) {
        parsedFiles.push(file)
      }
    })
  }
  //we add the qg-config.yaml file at the beginning for easy access
  parsedFiles.unshift({
    filename: 'qg-config.yaml',
    content: parsedQGConfig,
  })

  return parsedFiles
}

const parseQGConfig = (
  data: string,
  selectedChapter: string,
  selectedRequirement: string,
  selectedCheck: string
): ParsedQGConfig => {
  const parsedData: QGConfig = yaml.parse(data, { strict: true })

  if (parsedData.chapters?.[selectedChapter] !== undefined) {
    if (
      parsedData.chapters?.[selectedChapter]?.requirements?.[
        selectedRequirement
      ] !== undefined
    ) {
      if (
        parsedData.chapters?.[selectedChapter]?.requirements?.[
          selectedRequirement
        ]?.checks?.[selectedCheck] === undefined
      ) {
        throw new Error('Invalid check')
      }
    } else {
      throw new Error('Invalid requirement')
    }
  } else {
    throw new Error('Invalid chapter')
  }

  const check =
    parsedData.chapters?.[selectedChapter]?.requirements?.[selectedRequirement]
      ?.checks?.[selectedCheck]
  const usedAutopilot = parsedData.autopilots[check.automation?.autopilot] ?? {}

  return {
    title: check.title,
    run: {
      autopilot: check.automation?.autopilot ?? '',
      script: usedAutopilot.run ?? '',
      config: usedAutopilot.config ?? [],
      env: {
        ...check.automation?.env,
        ...usedAutopilot?.env,
      },
    },
  }
}

const fileUsedInScript = (file: File, script: string) => {
  //First we filter out data files
  if (
    file.filename.endsWith('.json') ||
    file.filename.endsWith('.csv') ||
    file.filename.endsWith('.txt')
  ) {
    return false
  }

  //Only include files that are context related we search the script for file names and only include those
  const regex = new RegExp(file.filename, 'g')
  return script.match(regex) !== null
}
