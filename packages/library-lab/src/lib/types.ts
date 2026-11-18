export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type Tab = 'demo' | 'docs' | 'readme' | 'website' | 'agent' | 'related'
export type Level = 'basic' | 'business' | 'advanced'
export type Result = 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED'
export interface Demo {
  demoId: string
  title: string
  level: Level
  executionKind: 'react' | 'browser-frame' | 'worker' | 'node-ci'
  entryPoint?: string
  sourceFiles: string[]
  capabilities?: string[]
  description?: string
}
export interface OfficialReadme {
  repository: string
  commit: string
  path: string
  sourceUrl: string
  snapshotPath: 'official/readme.md'
  language: 'en' | 'zh' | 'zh-CN' | 'zh-TW'
  version: string
  syncedAt: string
  sha256: string
}
export interface OfficialSources {
  readme: OfficialReadme
  homepage: {
    url: string
    kind: 'website' | 'repository'
    status: 'allowed' | 'blocked' | 'unknown'
    checkedAt: string
    reason: string
  }
}
export interface Entry {
  schemaVersion: 1
  entryId: string
  slug: string
  name: string
  group: Group
  summary: string
  tags: string[]
  contentState: 'missing' | 'imported' | 'reviewed' | 'recreated'
  packages: { name: string; version: string | null }[]
  references: { title: string; url: string }[]
  official?: OfficialSources
  buildSummaryAvailable?: boolean
  related: {
    entryId: string
    relation: 'alternative' | 'complements' | 'migration-to'
    reason: string
  }[]
  demos: Demo[]
  directory: string
  guideAvailable: boolean
  agentAvailable: boolean
  sourceFingerprint: string
  sourceIndexSha256: string
  verification: Record<
    string,
    {
      status: Result
      note?: string
      evidence?: string
      command?: string
      sourceFingerprint?: string
    }
  >
}
export interface DemoProps {
  level: Level
}
export interface SourceMetadata {
  path: string
  sha256: string
  bytes: number
}

/** Landing-page record: no SDK manifests or validation claims are downloaded here. */
export interface CatalogEntry {
  entryId: string
  slug: string
  name: string
  group: Group
  summary: string
  tags: string[]
  contentState: Entry['contentState']
  packageNames: string[]
  hasDemo: boolean
  demoCount: number
  /** How the page can run the entry. This is not a verification receipt. */
  surfaces: Array<'browser-frame' | 'node-ci' | 'react' | 'worker'>
  /** sdk/build/browser PASS rows after receipt checks. CI success is not included. */
  receiptPasses: number
  sourceFingerprint: string
}
