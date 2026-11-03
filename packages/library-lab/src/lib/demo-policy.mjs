import { safeRelativePath } from './catalog.mjs'

// A React lazy import runs on Library Lab's own origin. Workers are not a security
// boundary; service workers and privileged storage must use an isolated origin.
const ISOLATED = new Set([
  'service-worker',
  'cross-origin-isolation',
  'untrusted-script',
  'persistent-network-interception',
  'global-service-worker',
])
// These features may be documented or reproduced by a Node CLI, but cannot
// silently execute inside a React component or dedicated Worker on the SPA origin.
const HOST_PRIVILEGES = new Set(['network-interception', 'node-process'])
export const CAPABILITY_DESCRIPTIONS = Object.freeze({
  'service-worker': 'Service Worker（需要独立域名与作用域）',
  'cross-origin-isolation': '跨源隔离（需要专用响应头和独立预览）',
  'untrusted-script': '不可信脚本（禁止在主站执行）',
  'persistent-network-interception': '持久网络拦截（禁止控制主站）',
  'global-service-worker': '全局 Service Worker（禁止控制主站）',
  'web-worker': 'Web Worker',
  'local-session-storage': '会话存储（需独立命名空间和清理）',
  'node-process': 'Node.js 进程（仅复制命令）',
  'network-interception': '网络拦截（仅在隔离运行器中执行）',
})

export function demoRunPolicy(demo) {
  if (!demo || typeof demo !== 'object') return { mode: 'unavailable', reason: '示例未定义' }
  const caps = Array.isArray(demo.capabilities) ? demo.capabilities : []
  const blocked = caps.filter(
    (cap) => ISOLATED.has(cap) || (demo.executionKind !== 'node-ci' && HOST_PRIVILEGES.has(cap)),
  )
  if (blocked.length)
    return {
      mode: 'isolated',
      reason: `包含需要独立运行环境的能力：${blocked.map((cap) => CAPABILITY_DESCRIPTIONS[cap]).join('、')}。当前主站不会执行此示例。`,
    }
  if (demo.executionKind === 'node-ci')
    return {
      mode: 'reproduction',
      reason: '命令行示例只能在受控 Node.js 环境中复现，网页不会启动本地命令。',
    }
  if (demo.executionKind === 'worker')
    return safeRelativePath(demo.entryPoint)
      ? {
          mode: 'worker',
          reason: '已注册的受审查 Worker 示例可以显式启动并在离开时终止；不是不可信脚本沙箱。',
        }
      : { mode: 'unavailable', reason: 'Worker 入口无效' }
  if (demo.executionKind === 'browser-frame')
    return {
      mode: 'isolated',
      reason: '需要专用隔离 origin；当前不会在主站 iframe 执行此示例。',
    }
  if (demo.executionKind !== 'react' || !safeRelativePath(demo.entryPoint))
    return {
      mode: 'unavailable',
      reason: '没有经过注册的 React 示例入口。',
    }
  return { mode: 'react', reason: 'React 示例可在用户明确启动后按需载入；停止时应释放本示例资源。' }
}
