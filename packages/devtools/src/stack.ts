export type DevStackFrame = {
  text: string
  file?: string
  line?: number
  column?: number
}

const LOCATION =
  /((?:https?:\/\/\S+)|(?:webpack-internal:\/\/\/\S+)|(?:[A-Za-z]:[/\\]\S+)|(?:\/\S+)|(?:(?:src|app)\/\S+)):(\d+):(\d+)\s*$/

/**
 * Turns a browser or Metro stack into project frames. `file` is set only for
 * this repo's source, so a frame can be opened without jumping into dependencies.
 */
export function parseDevStack(stack: string): DevStackFrame[] {
  return stack.split('\n').map((line) => {
    const text = line.trimEnd()
    const located = locateFrame(text.trim())
    return located ? { text, ...located } : { text }
  })
}

/** `data-insp-path` is `file:line:column:name`. The last segment is the label. */
export function devInspectorPath(frame: { file: string; line: number; column: number }): string {
  return `${frame.file}:${frame.line}:${frame.column}:frame`
}

function locateFrame(line: string): Pick<DevStackFrame, 'file' | 'line' | 'column'> | undefined {
  const withoutWrapper = line.replace(/\)\s*$/, '')
  const match = withoutWrapper.match(LOCATION)
  if (!match?.[1] || !match[2] || !match[3]) return undefined
  const file = projectFile(match[1])
  if (!file) return undefined
  return { file, line: Number(match[2]), column: Number(match[3]) }
}

function projectFile(rawFile: string): string | undefined {
  const noQuery = rawFile.replace(/\?.*$/, '')
  const unwrapped = noQuery
    .replace(/^webpack-internal:\/\/\/(?:[^/]+\/)*\.\//, '')
    .replace(/^https?:\/\/[^/]+\//, '')
  if (unwrapped.includes('node_modules')) return undefined
  const embedded = unwrapped.match(/(?:^|\/)((?:src|app)\/.+)$/)
  const file = embedded?.[1] ?? unwrapped
  if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) return undefined
  if (file.includes('node_modules')) return undefined
  return file
}
