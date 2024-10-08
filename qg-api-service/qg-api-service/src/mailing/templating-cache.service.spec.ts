import fs from 'fs/promises'
import { NotificationType } from './mailing.utils'
import { TemplatingCache } from './templating-cache.service'

describe('TemplatingCache', () => {
  const mjmlTemplate = `
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>
            Hello <%- data.name %>!
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`

  beforeEach(() => {
    jest.resetModules()
  })

  it('should instantiate a new TemplatingCache that populates the templates map', async () => {
    jest.spyOn(fs, 'readdir').mockResolvedValue([
      {
        isFile: () => true,
        name: 'comment.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'mention.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'approver.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'approval_status.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'task_assigned.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'task_recurring.mjml',
      } as any,
      {
        isFile: () => true,
        name: 'check_override.mjml',
      } as any,
    ])
    jest.spyOn(fs, 'readFile').mockResolvedValue(mjmlTemplate)
    const templatingCache = new TemplatingCache('path/to/templates')
    expect(templatingCache).toBeDefined()
    await templatingCache.onApplicationBootstrap()
    expect(templatingCache.has(NotificationType.Comment)).toBe(true)
    expect(templatingCache.get(NotificationType.Comment)).toBeDefined()
  })

  it.each([
    `test`,
    `
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>
            Hello <%- data.name >!
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`,
  ])(
    'should throw an error if the template can not be compiled',
    async (template: string) => {
      jest.spyOn(fs, 'readdir').mockResolvedValue([
        {
          isFile: () => true,
          name: 'comment.mjml',
        } as any,
        {
          isFile: () => true,
          name: 'mention.mjml',
        } as any,
        {
          isFile: () => true,
          name: 'approver.mjml',
        } as any,
        {
          isFile: () => true,
          name: 'approval_status.mjml',
        } as any,
      ])
      jest.spyOn(fs, 'readFile').mockResolvedValue(template)
      const templatingCache = new TemplatingCache('path/to/templates')
      expect(templatingCache).toBeDefined()
      await expect(templatingCache.onApplicationBootstrap()).rejects.toThrow()
    }
  )
})
