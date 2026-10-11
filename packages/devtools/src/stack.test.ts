import { describe, expect, it } from 'vitest'
import { devInspectorPath, parseDevStack } from './stack.js'

describe('parseDevStack', () => {
  it('keeps Vite URLs as project paths and drops dependency frames', () => {
    const frames = parseDevStack(
      [
        'Error: The loom snagged.',
        '    at TasksPage (http://127.0.0.1:4317/src/features/tasks/tasks-page.tsx?t=1:10:5)',
        '    at renderWithHooks (http://127.0.0.1:4317/node_modules/.vite/deps/react-dom.js:20:3)',
      ].join('\n'),
    )
    expect(frames[1]).toMatchObject({
      file: 'src/features/tasks/tasks-page.tsx',
      line: 10,
      column: 5,
    })
    expect(frames[2]?.file).toBeUndefined()
    expect(frames[0]?.file).toBeUndefined()
  })

  it('unwraps Turbopack and webpack-internal frames', () => {
    const frames = parseDevStack(
      '    at LoginPage (webpack-internal:///(app-pages-browser)/./src/app/login/page.tsx:23:11)',
    )
    expect(frames[0]).toMatchObject({
      file: 'src/app/login/page.tsx',
      line: 23,
      column: 11,
    })
  })

  it('shortens absolute paths and reads Expo app files', () => {
    const frames = parseDevStack(
      [
        '    at TasksScreen (address at /workspace/templates/mobile/app/tasks.tsx:12:4)',
        '    at Home (app/index.tsx:8:2)',
      ].join('\n'),
    )
    expect(frames[0]).toMatchObject({ file: 'app/tasks.tsx', line: 12, column: 4 })
    expect(frames[1]).toMatchObject({ file: 'app/index.tsx', line: 8, column: 2 })
  })
})

describe('devInspectorPath', () => {
  it('ends with the frame label so the inspector can split line and column', () => {
    expect(devInspectorPath({ file: 'src/app/login/page.tsx', line: 23, column: 11 })).toBe(
      'src/app/login/page.tsx:23:11:frame',
    )
  })
})
