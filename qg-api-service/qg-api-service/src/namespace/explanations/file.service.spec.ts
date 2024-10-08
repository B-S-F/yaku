import { parseRunFiles } from './file.service'
import { File, ParsedQGConfig } from './types'

describe('importYAMLData', () => {
  const files: File[] = [
    {
      filename: 'qg-config.yaml',
      content: `
    metadata:
      version: v1
    header:
      name: JSON
      version: 1.2.3
    autopilots:
      json-evaluator-autopilot:
        run: |
          json-evaluator
        env:
          JSON_CONFIG_FILE: test.yaml
          JSON_INPUT_FILE: test.json
    finalize:
      run: |
        html-finalizer
    chapters:
      '5':
        title: Verification / validation
        requirements:
          '5.1':
            title: The json evaluator works well
            text: |-
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            checks:
              '1':
                title: Check json file
                automation:
                  autopilot: json-evaluator-autopilot`,
    },
    {
      filename: 'test.json',
      content: 'test.json should be omitted',
    },
    {
      filename: 'test.yaml',
      content: `
      checks:
      - name: merged_check
        ref: $.values[*]
        condition: all(ref, "'OPEN' === $.state")
        return_if_empty: GREEN
        return_if_not_found: YELLOW
        log: $.links.self[*].href
      - name: has_specific_reviewer
        ref: $.values[*].reviewers
        condition: all(ref, "($[*].user.name).includes('KNM2RLZ')")
      - name: has_reviewer
        ref: $.values[*]
        condition: all(ref, "($.reviewers).length !== 0")
        log: $.links.self[*].href
    concatenation:
      condition: 'merged_check && has_reviewer && has_specific_reviewer'`,
    },
  ]

  const extraFile: File = {
    filename: 'extra-file.yaml',
    content: `extra file that is not used in the qg-config.yaml`,
  }

  it('should return processed files when valid input is provided while excluding data files', () => {
    const selectedChapter = '5'
    const selectedRequirement = '5.1'
    const selectedCheck = '1'

    const parsedQg: ParsedQGConfig = {
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

    const parsedData = parseRunFiles(
      files,
      selectedChapter,
      selectedRequirement,
      selectedCheck
    )

    expect(JSON.stringify(parsedData[0].content)).toEqual(
      JSON.stringify(parsedQg)
    )
    expect(parsedData[1].content).toEqual(files[2].content)
    expect(parsedData).toHaveLength(2)
  })

  it('should return processed data without extra script and data files', () => {
    const selectedChapter = '5'
    const selectedRequirement = '5.1'
    const selectedCheck = '1'

    const parsedQg: ParsedQGConfig = {
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

    const filesWithExtra = [...files]
    filesWithExtra.push(extraFile)

    const parsedData = parseRunFiles(
      filesWithExtra,
      selectedChapter,
      selectedRequirement,
      selectedCheck
    )

    expect(JSON.stringify(parsedData[0].content)).toEqual(
      JSON.stringify(parsedQg)
    )
    expect(parsedData[1].content).toEqual(files[2].content)
    expect(parsedData).toHaveLength(2)
  })

  it('should throw an error when invalid input is provided', () => {
    const data: File[] = [
      {
        filename: 'qg-config.yaml',
        content: ` some wrong data`,
      },
    ]
    const selectedChapter = 'chapter1'
    const selectedRequirement = 'requirement1'
    const selectedCheck = 'check1'

    expect(() => {
      parseRunFiles(data, selectedChapter, selectedRequirement, selectedCheck)
    }).toThrowError()
  })

  it('should throw an error when an invalid chapter is provided', () => {
    const selectedChapter = 'invalid_chapter'
    const selectedRequirement = 'requirement1'
    const selectedCheck = 'check1'

    expect(() => {
      parseRunFiles(files, selectedChapter, selectedRequirement, selectedCheck)
    }).toThrowError()
  })

  it('should throw an error when an invalid requirement is provided', () => {
    const selectedChapter = 'chapter1'
    const selectedRequirement = 'invalid_requirement'
    const selectedCheck = 'check1'

    expect(() => {
      parseRunFiles(files, selectedChapter, selectedRequirement, selectedCheck)
    }).toThrowError()
  })

  it('should throw an error when an invalid check is provided', () => {
    const selectedChapter = 'chapter1'
    const selectedRequirement = 'requirement1'
    const selectedCheck = 'invalid_check'

    expect(() => {
      parseRunFiles(files, selectedChapter, selectedRequirement, selectedCheck)
    }).toThrowError()
  })
})
