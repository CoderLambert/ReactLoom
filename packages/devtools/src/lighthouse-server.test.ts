// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createLighthouseServer,
  isLocalDevtoolsRequest,
  summarizeLighthouse,
} from './lighthouse-server.js'

const report = {
  fetchTime: '2026-10-11T10:00:00.000Z',
  finalDisplayedUrl: 'http://127.0.0.1:4318/',
  categories: {
    performance: { title: 'Performance', score: 0.91 },
    accessibility: { title: 'Accessibility', score: null },
  },
  audits: {
    'largest-contentful-paint': {
      title: 'Largest Contentful Paint',
      displayValue: '1.2 s',
      score: 0.95,
    },
    passed: { title: 'Passed audit', score: 1 },
    manual: { title: 'Manual audit', score: null },
  },
}

describe('local Lighthouse bridge', () => {
  it('rejects remote hosts and cross-origin requests', () => {
    expect(isLocalDevtoolsRequest('127.0.0.1:4318', 'http://127.0.0.1:4318')).toBe(true)
    expect(isLocalDevtoolsRequest('localhost:4317', null)).toBe(true)
    expect(isLocalDevtoolsRequest('evil.example', 'http://evil.example')).toBe(false)
    expect(isLocalDevtoolsRequest('localhost:4318', 'http://evil.example')).toBe(false)
    expect(isLocalDevtoolsRequest(null, null)).toBe(false)
  })

  it('summarizes scores and metrics, excluding passed and manual audits', () => {
    const summary = summarizeLighthouse(report)
    expect(summary?.categories.map((item) => item.score)).toEqual([0.91, null])
    expect(summary?.metrics).toEqual([{ title: 'Largest Contentful Paint', value: '1.2 s' }])
    expect(summary?.audits).toEqual([{ title: 'Largest Contentful Paint', value: '1.2 s' }])
    expect(summarizeLighthouse({ token: 'unrelated data' })).toBeNull()
  })

  it('reads a valid report and skips incomplete or unrelated JSON files', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'reactloom-lighthouse-'))
    try {
      const directory = path.join(root, '.lighthouseci')
      await mkdir(directory)
      await writeFile(path.join(directory, 'lhr-valid.json'), JSON.stringify(report))
      await writeFile(path.join(directory, 'lhr-incomplete.json'), '{')
      await writeFile(path.join(directory, 'manifest.json'), '{"private":"unrelated"}')
      const state = await createLighthouseServer(root, 'http://127.0.0.1:4318/').state()
      expect(state.running).toBe(false)
      expect(state.report?.url).toBe(report.finalDisplayedUrl)
      expect(state.report?.fetchedAt).toBe(report.fetchTime)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
