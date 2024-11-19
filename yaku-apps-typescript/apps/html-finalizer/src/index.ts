import { readFile } from 'fs/promises'
import { utils } from './ejs-utils.js'
import FileRenderer, { OutputFile } from './render-file.js'
import YAML from 'yaml'
import path from 'path'

const outputFiles: OutputFile[] = [
  {
    template: './qg-dashboard-template.ejs',
    output: 'qg-dashboard.html',
    default: true,
  },
  {
    template: './qg-result-template.ejs',
    output: 'qg-result.html',
    default: true,
  },
  {
    template: './qg-evidence-template.ejs',
    output: 'qg-evidence.html',
    default: true,
  },
  {
    template: './qg-full-report-template.ejs',
    output: 'qg-full-report.html',
    additionalConfig: { pdfExport: true, silent: true },
    default: true,
  },
]

export async function renderHtmlFiles(fileList?: string[]) {
  const { result_path: resultPath, HIDE_UNANSWERED: hideUnanswered } =
    process.env
  if (!resultPath) {
    throw new Error('result_path environment variable is not set')
  }
  utils.hideUnanswered = Boolean(hideUnanswered)

  const result = await YAML.parse(
    await readFile(path.join(resultPath, 'qg-result.yaml'), {
      encoding: 'utf8',
    }),
  )
  const resultWithUtils = { ...result, utils }
  const renderFile = FileRenderer(resultWithUtils, resultPath)
  const requestedOutputFiles = fileList
    ? outputFiles.filter((file) => fileList.includes(file.output))
    : outputFiles.filter((file) => file.default)
  for (const outputFile of requestedOutputFiles) {
    await renderFile(outputFile)
  }
}
