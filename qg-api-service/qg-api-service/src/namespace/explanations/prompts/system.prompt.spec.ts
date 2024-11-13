import { getSystemPrompt } from './system.prompt'

describe('GenerateSystemPrompt', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should generate the system prompt with autopilot examples', () => {
    const expectedHeaders = [
      '## Role ##',
      '## Context ##',
      '## Input Format ##',
      '### Code Section ###',
      '### Autopilots Section ###',
      '## General Guidance ##',
      '## Handling Additional Files ##',
      '## Output Format ##',
      '## Fewshot examples ##',
    ]

    const generatedPrompt_1 = getSystemPrompt()
    const generatedPrompt_2 = getSystemPrompt()

    expectedHeaders.forEach((header) => {
      expect(generatedPrompt_1.content).toContain(header)
      expect(generatedPrompt_2.content).toContain(header)
    })

    expect(generatedPrompt_2.content.length).toEqual(10769)
  })
})
