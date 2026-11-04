import { fileURLToPath } from 'node:url'
import { GANTT_APP_ORIGINS, GANTT_SESSION } from '../src/lib/gantt-frame-session.mjs'

const base = '/lab-runners/gantt/'
const packageRoot = fileURLToPath(new URL('../', import.meta.url))
export const GANTT_HEADERS = Object.freeze({
  'Content-Security-Policy': `default-src 'none'; script-src 'self'; worker-src 'none'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors ${GANTT_APP_ORIGINS.join(' ')}`,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
})
export function createGanttSessionMiddleware({ development = false } = {}) {
  const sdkFile = development ? fileURLToPath(import.meta.resolve('frappe-gantt')) : ''
  const sdkStyle = development
    ? fileURLToPath(new URL('./frappe-gantt.css', import.meta.resolve('frappe-gantt')))
    : ''
  const viteEnv = development
    ? fileURLToPath(new URL('../client/env.mjs', import.meta.resolve('vite')))
    : ''
  return (request, response, next) => {
    for (const [name, value] of Object.entries(GANTT_HEADERS)) response.setHeader(name, value)
    const host = request.headers.host
    const origin =
      host === '127.0.0.1:4321'
        ? GANTT_APP_ORIGINS[0]
        : host === 'localhost:4321'
          ? GANTT_APP_ORIGINS[1]
          : null
    const reject = (status) => {
      response.statusCode = status
      response.end()
    }
    if (
      !origin ||
      (request.headers.origin &&
        ![origin, origin.replace(':4319', ':4321')].includes(request.headers.origin))
    )
      return reject(403)
    if (!['GET', 'HEAD'].includes(request.method)) return reject(405)
    if (
      typeof request.url !== 'string' ||
      !request.url.startsWith(base) ||
      request.url.includes('%') ||
      request.url.includes('\\') ||
      request.url
        .split('?')[0]
        .split('/')
        .some((part) => part === '.' || part === '..') ||
      [...request.url].some((char) => char.charCodeAt(0) <= 32)
    )
      return reject(404)
    const url = new URL(request.url, `http://${host}`)
    const match = url.pathname.match(/^\/lab-runners\/gantt\/sessions\/([^/]+)\/$/u)
    if (match && GANTT_SESSION.test(match[1]) && !url.search) {
      request.url = `${base}index.html`
      next()
      return
    }
    const asset = /^\/lab-runners\/gantt\/assets\/[A-Za-z0-9_.-]+$/u.test(url.pathname)
    const deps = `${base}@fs${packageRoot}node_modules/.vite/deps/`
    const source =
      development &&
      (['main.tsx', '@vite/client'].some((name) => url.pathname === base + name) ||
        (url.pathname.startsWith(deps) &&
          /^[A-Za-z0-9_.-]+$/u.test(url.pathname.slice(deps.length))) ||
        url.pathname === `${base}@fs${packageRoot}src/lib/gantt-frame-session.mjs` ||
        ['example.tsx', 'gantt.css', 'plan-policy.mjs'].some(
          (name) =>
            url.pathname === `${base}@fs${packageRoot}entries/C13-frappe-gantt/examples/${name}`,
        ) ||
        [sdkFile, sdkStyle, viteEnv].some((file) => url.pathname === `${base}@fs${file}`))
    const query =
      [...url.searchParams].every(
        ([key, value]) =>
          development &&
          ((key === 'v' && /^[a-f0-9]{8,64}$/u.test(value)) ||
            (['import', 'direct'].includes(key) && value === '')),
      ) && new Set(url.searchParams.keys()).size === [...url.searchParams].length
    if (!(asset || source) || !query) return reject(404)
    next()
  }
}
