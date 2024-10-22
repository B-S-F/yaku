import markdown from '@B-S-F/markdown-utils'

const statusIconMap: { [status: string]: string } = {
  RED: 'error',
  YELLOW: 'alert-warning',
  GREEN: 'check-circle',
  NA: 'denied',
  UNANSWERED: 'text-unanswered',
  FAILED: 'report',
  ERROR: 'bug',
  SKIPPED: 'text-skipped',
}

const statusTooltipMap: { [status: string]: string } = {
  RED: 'Check did not pass',
  YELLOW: 'Check passed with warning',
  GREEN: 'Check passed',
  NA: 'Check not applicable',
  UNANSWERED: 'No check configured',
  FAILED: 'Autopilot failed with user error',
  ERROR: 'Autopilot failed with runtime error',
  SKIPPED: 'Check was skipped',
}

const headerDisplayOrder = [
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'version',
    label: 'Version',
  },
  {
    key: 'date',
    label: 'Date',
  },
  {
    key: 'qgCliVersion',
    label: 'QG CLI Version',
  },
  {
    key: 'toolVersion',
    label: 'Tool Version',
  },
]

function sortedObjectEntries(
  object:
    | ArrayLike<unknown>
    | {
        [s: string]: unknown
      }
) {
  return Object.entries(object).sort((a, b) => {
    return a[0].localeCompare(b[0], undefined, { numeric: true })
  })
}

function sortedObjectValues(
  object:
    | ArrayLike<unknown>
    | {
        [s: string]: unknown
      }
) {
  return sortedObjectEntries(object).map(([_, entries]) => entries)
}

const COLOR_CODES = new Map<number, string>([
  [0, 'black'],
  [1, '#cc0000'],
  [2, '#4e9a06'],
  [3, '#c4a000'],
  [4, '#729fcf'],
  [5, '#75507b'],
  [6, '#06989a'],
  [7, '#d3d7cf'],
])

function escapeHtmlCharacters(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyStyle(style: Map<string, string>, text: string) {
  if (text === '') {
    return ''
  }
  const stylePairs = []
  for (const [prop, val] of style.entries()) {
    stylePairs.push(`${prop}:${val}`)
  }
  if (stylePairs.length > 0) {
    return `<span style="${stylePairs.join(';')}">${text}</span>`
  } else {
    return text
  }
}

function setStyleFromAnsiCode(style: Map<string, string>, code: number) {
  switch (true) {
    case code === 0: {
      style.clear()
      break
    }
    case code === 1: {
      style.set('font-weight', 'bold')
      break
    }
    case code === 2: {
      style.set('font-weight', 'lighter')
      break
    }
    case code === 3: {
      style.set('font-style', 'italic')
      break
    }
    case code === 4: {
      style.set('text-decoration', 'underline')
      break
    }
    case code === 22: {
      style.delete('font-weight')
      break
    }
    case code === 24: {
      style.delete('text-decoration')
      break
    }
    case code >= 30 && code <= 37: {
      const foregroundColor = COLOR_CODES.get(code % 10)
      if (foregroundColor !== undefined) {
        style.set('color', foregroundColor)
      }
      break
    }
    case code === 39: {
      style.delete('color')
      break
    }
    case code >= 40 && code <= 47: {
      const backgroundColor = COLOR_CODES.get(code % 10)
      if (backgroundColor !== undefined) {
        style.set('background-color', backgroundColor)
      }
      break
    }
    case code === 49: {
      style.delete('background-color')
      break
    }
    default: {
      console.log(`Ignoring unknown ANSI SGR code ${code}`)
      break
    }
  }
}

function formatLogs(lines: string[]) {
  const style = new Map<string, string>()
  const logs = escapeHtmlCharacters(lines.join('\n')) + '\n'
  const chunks = logs.split(/\033\[(.*?)m/).flatMap((chunk, i) => {
    if (i % 2 == 0) {
      // even elements are just chunks of text
      return applyStyle(style, chunk)
    } else {
      // odd elements are ANSI codes to interpret
      // these change the current style but do not produce any text
      for (const ansiCode of chunk.split(';').map(Number)) {
        setStyleFromAnsiCode(style, ansiCode)
      }
      return []
    }
  })
  return chunks.join('')
}

export const utils = {
  markdown,
  mapStatus(status: string) {
    if (!status) return null
    return statusIconMap[status] || ''
  },
  mapTooltip(status: string) {
    if (!status) return null
    return statusTooltipMap[status] || ''
  },
  formatLogs,
  sortedObjectEntries,
  sortedObjectValues,
  headerDisplayOrder,
  hideUnanswered: false,
  filterCount: 0,
  statuses: Object.keys(statusIconMap),
}
