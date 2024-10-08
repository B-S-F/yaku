import { File, ParsedQGConfig } from '../explanations/types'
import { generatePrompt } from './prompt.service'

const parsedQGConfig: ParsedQGConfig = {
  title: 'Check json file',
  run: {
    autopilot: 'json-evaluator-autopilot',
    script: 'json-evaluator\n',
    config: [],
    env: {
      JSON_CONFIG_FILE: 'test.yaml',
      JSON_INPUT_FILE: 'test.json',
    },
  },
}

const qgConfig: File = {
  filename: 'qg-config.yaml',
  content: parsedQGConfig,
}

const testYaml: File = {
  filename: 'test.yaml',
  content: `
  checks:
  - name: merged_check
    ref: $.values[*]
    condition: all(ref, "'OPEN' === $.state")
    return_if_empty: GREEN
    return_if_not_found: YELLOW
  `,
}

const OnekYaml: File = {
  filename: '1k.yaml',
  content: `- ` + '1'.repeat(3000),
}

const FourKYaml: File = {
  filename: '4k.yaml',
  content: `- ` + '4'.repeat(12000),
}

describe('GeneratePrompt', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should generate prompt for a short example', async () => {
    const files: File[] = [qgConfig, testYaml]
    const systemPromptTitles = [
      'Role',
      'Context',
      'Input Format',
      'Code Section',
      'General Guidance',
      'Handling Additional Files',
      'Autopilots Section',
      'Output Format',
      'Fewshot examples',
    ]
    const userPromptTitles = ['Code Section', 'Autopilots Section']
    const userPromptContent = [
      'title: Check json file',
      'test.yaml:',
      'condition: all(ref, "\'OPEN\' === $.state")',
      'JSON_CONFIG_FILE: test.yaml',
      'json-evaluator: Because JSON data format is so common, we have got a JSON autopilot for you!',
    ]

    const result = await generatePrompt(files)

    //expect a system and a user prompt
    expect(result.length).toEqual(2)
    //expect the system prompt to be correct
    systemPromptTitles.forEach((title) => {
      expect(result[0].content).toContain(title)
    })
    //expect the user prompt to contain correct titles
    userPromptTitles.forEach((title) => {
      expect(result[1].content).toContain(title)
    })
    //expect the user prompt to contain the correct content
    userPromptContent.forEach((content) => {
      expect(result[1].content).toContain(content)
    })
  })

  it('should trim files when prompts exceeds the token limit', async () => {
    const files: File[] = [
      qgConfig,
      testYaml,
      OnekYaml,
      FourKYaml,
      OnekYaml,
      OnekYaml,
    ]
    const systemPromptTitles = [
      'Role',
      'Context',
      'Input Format',
      'Code Section',
      'General Guidance',
      'Handling Additional Files',
      'Autopilots Section',
      'Output Format',
      'Fewshot examples',
    ]
    const userPromptTitles = ['Code Section', 'Autopilots Section']
    const userPromptContent = [
      'title: Check json file',
      'test.yaml:',
      'condition: all(ref, "\'OPEN\' === $.state")',
      'JSON_CONFIG_FILE: test.yaml',
      'json-evaluator: Because JSON data format is so common, we have got a JSON autopilot for you!',
    ]

    const result = await generatePrompt(files)

    //expect a system and a user prompt
    expect(result.length).toEqual(2)
    //expect the system prompt to be correct
    systemPromptTitles.forEach((title) => {
      expect(result[0].content).toContain(title)
    })
    //expect the user prompt to contain correct titles
    userPromptTitles.forEach((title) => {
      expect(result[1].content).toContain(title)
    })
    //expect the user prompt to contain the correct content
    userPromptContent.forEach((content) => {
      expect(result[1].content).toContain(content)
    })
    //expect the correct amount of files
    expect(
      [...result[1].content.matchAll(new RegExp(`1k.yaml`, `gi`))].length
    ).toEqual(3)
    expect(
      [...result[1].content.matchAll(new RegExp(`4k.yaml`, `gi`))].length
    ).toEqual(0)
  })

  it('should throw error when user prompt exceeds the token limit even after file trimming', async () => {
    const largeQgConfig: ParsedQGConfig = {
      title: 'Check json file',
      run: {
        autopilot: 'json-evaluator-autopilot',
        script: (FourKYaml.content as string) + (FourKYaml.content as string),
        config: [],
        env: {
          JSON_CONFIG_FILE: 'test.yaml',
          JSON_INPUT_FILE: 'test.json',
        },
      },
    }

    const files: File[] = [
      {
        filename: 'qg-config.yaml',
        content: largeQgConfig,
      },
      testYaml,
      OnekYaml,
      FourKYaml,
    ]
    await expect(generatePrompt(files)).rejects.toThrowError(
      'Information exceeds token limit'
    )
  })
})
