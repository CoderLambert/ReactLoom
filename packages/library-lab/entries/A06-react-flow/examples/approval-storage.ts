import {
  type Definition,
  ensure,
  finite,
  LIMITS,
  list,
  object,
  parseDefinition,
  type Release,
  readDefinition,
  text,
} from './approval-model.ts'
import { type Decision, inspectRequest, type Request, validateValues } from './approval-runtime.ts'

export type Workspace = {
  schemaVersion: 1
  draft: Definition
  release: Release | null
  requests: Request[]
}
function timestamp(value: unknown): string {
  const result = text(value, 40)
  ensure(Number.isFinite(Date.parse(result)), '时间格式无效')
  return result
}
function readRelease(value: unknown): Release {
  const r = object(value, ['version', 'publishedAt', 'definition'])
  const version = finite(r.version, 1, 1000000)
  ensure(Number.isSafeInteger(version), '版本必须为正整数')
  return {
    version,
    publishedAt: timestamp(r.publishedAt),
    definition: parseDefinition(JSON.stringify(r.definition)),
  }
}
export function parseWorkspace(json: string): Workspace {
  ensure(json.length <= 2_000_000, '本地工作区超过 2 MB 限制')
  const w = object(JSON.parse(json), ['schemaVersion', 'draft', 'release', 'requests'])
  ensure(w.schemaVersion === 1, '工作区版本不支持')
  const requests = list(w.requests, LIMITS.requests).map((value) => {
    const r = object(value, ['id', 'release', 'values', 'submittedAt', 'decisions'])
    const release = readRelease(r.release)
    ensure(
      r.values !== null && typeof r.values === 'object' && !Array.isArray(r.values),
      '表单值无效',
    )
    const values = validateValues(release, r.values as Request['values'])
    const decisions = list(r.decisions, LIMITS.nodes).map((value) => {
      const d = object(value, ['nodeId', 'actor', 'decision', 'comment', 'at'])
      ensure(d.decision === 'approve' || d.decision === 'reject', '审批动作无效')
      return {
        nodeId: text(d.nodeId),
        actor: text(d.actor),
        decision: d.decision,
        comment: text(d.comment, 500, true),
        at: timestamp(d.at),
      } satisfies Decision
    })
    const request = {
      id: text(r.id),
      release,
      values,
      submittedAt: timestamp(r.submittedAt),
      decisions,
    }
    inspectRequest(request)
    return request
  })
  ensure(new Set(requests.map((r) => r.id)).size === requests.length, '工单标识重复')
  return {
    schemaVersion: 1,
    draft: readDefinition(w.draft),
    release: w.release === null ? null : readRelease(w.release),
    requests,
  }
}
export function saveWorkspace(
  storage: Pick<Storage, 'setItem'> & Partial<Pick<Storage, 'getItem'>>,
  key: string,
  workspace: Workspace,
  expected?: string | null,
): void {
  const json = JSON.stringify(workspace)
  parseWorkspace(json)
  if (expected !== undefined) {
    ensure(
      storage.getItem && storage.getItem(key) === expected,
      '其他页面已更新工作区，已阻止覆盖。请先复制未保存的配置，再重新载入。',
    )
  }
  storage.setItem(key, json)
}
