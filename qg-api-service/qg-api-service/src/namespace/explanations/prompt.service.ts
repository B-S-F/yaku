import { File, ParsedQGConfig } from './types'
import { getSystemPrompt } from './prompts/system.prompt'
import {
  Prompt,
  Roles,
  getMaxPromptLength,
  getTokenLength,
} from '../../gp-services/openai.utils'
import { getAutoPilotsInfo } from './prompts/apps.prompts'
import * as yaml from 'yaml'

export const generatePrompt = async (files: File[]): Promise<Prompt[]> => {
  const prompts: {
    role: Roles
    content: string
  }[] = [
    {
      role: 'system',
      content: '',
    },
    {
      role: 'user',
      content: '',
    },
  ]
  const parsedQGConfig: ParsedQGConfig = files[0].content as ParsedQGConfig
  //search in the script for any used autopilots and get their descriptions
  const usedAutopilotsDescription = getAutoPilotsInfo(parsedQGConfig.run.script)

  //1. Create our system prompt
  prompts[0].content = getSystemPrompt().content

  //2. Create our user prompt
  const userPrompt = `
  #### Code Section ####
  ${yaml.stringify(parsedQGConfig)}
  ${
    files.length > 1
      ? files
          .filter((file) => file.filename !== 'qg-config.yaml')
          .reduce((acc: string, file: File) => {
            return (
              acc +
              `- ${file.filename}: ${file.content}

`
            )
          }, '')
      : ''
  }
  #### Autopilots Section ####
  ${
    usedAutopilotsDescription.length > 0
      ? usedAutopilotsDescription.map(
          (autopilot) => `- ${autopilot.name}: ${autopilot.description}`
        )
      : '- *see bash script*'
  }
  `
  //3. Add the created user prompt to the prompts array
  prompts[1].content = userPrompt
  const buff = await trimPrompts(prompts, files)
  return buff
}

const trimPrompts = async (
  prompts: Prompt[],
  files: File[]
): Promise<Prompt[]> => {
  //1. Check if prompt fits in the token limit
  const promptLength = await getTokenLength(
    prompts.reduce((acc, prompt) => acc + prompt.content, '')
  )

  if (promptLength > getMaxPromptLength()) {
    //Doesn't fit in token limit, we need to remove some information
    //get length of each file, except the qg-config.yaml
    const filesLength: {
      filename: string
      length: number
      content: string
    }[] = []

    for (const file of files) {
      if (file.filename !== 'qg-config.yaml') {
        const length = await getTokenLength(file.content as string)
        filesLength.push({
          filename: file.filename,
          length,
          content: file.content as string,
        })
      }
    }

    //sort the files by length
    filesLength.sort((a, b) => a.length - b.length)

    //Getting the amount that the limit is exceeded by
    let extraAmount = promptLength - getMaxPromptLength()

    //We want to remove as little information as possible, so we use a greedy approach
    //We will be removing enough files to get under the limit but also keep the amount of removed information as low as possible
    //We start with larger files and move to smaller files
    //to keep context and information as much as possible, we prefer to remove files that are over the limit -> less removed files

    //1. find the file index that is closest to the limit, preferably over or equal to it
    let fileIndex = filesLength.findIndex((file) => file.length >= extraAmount)
    if (fileIndex === -1) {
      //if no file is over the limit, we will start from the last file as that is the largest
      fileIndex = filesLength.length - 1
    }

    //2. We remove files from the found file to the beginning of the array until we are under the limit
    while (extraAmount > 0 && fileIndex >= 0) {
      prompts[1].content = prompts[1].content.replace(
        `- ${filesLength[fileIndex].filename}: ${filesLength[fileIndex].content}`,
        ''
      )
      extraAmount -= filesLength[fileIndex].length
      fileIndex--
    }

    if (extraAmount > 0) {
      //Still have extra information, this (and the above files) should be handled in the future by splitting the information into multiple prompts
      throw new Error('Information exceeds token limit')
    }
  }

  return prompts
}
