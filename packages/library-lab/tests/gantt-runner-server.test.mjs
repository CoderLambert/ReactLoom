import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
import test from 'node:test'

test('real HTTP restricts session URL, exact Host and method before fixed HTML handling', async (t) => {
  let api
  try {
    api = await import('../scripts/gantt-runner-server.mjs')
  } catch {}
  assert.equal(typeof api?.createGanttSessionMiddleware, 'function')
  const middleware = api.createGanttSessionMiddleware()
  const server = createServer((request, response) =>
    middleware(request, response, () => {
      response.setHeader('content-type', 'text/html')
      response.end(request.url)
    }),
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`,
    path = '/lab-runners/gantt/sessions/01234567-89ab-4cde-8fab-0123456789ab/'
  const request = (pathname, options = {}) =>
    new Promise((resolve, reject) => {
      const call = httpRequest(
        origin,
        { path: pathname, ...options, headers: { host: '127.0.0.1:4321', ...options.headers } },
        (response) => {
          let body = ''
          response.setEncoding('utf8')
          response.on('data', (chunk) => {
            body += chunk
          })
          response.on('end', () =>
            resolve({
              status: response.statusCode,
              headers: response.headers,
              text: async () => body,
            }),
          )
        },
      )
      call.on('error', reject)
      call.end()
    })
  const response = await request(path)
  assert.equal(await response.text(), '/lab-runners/gantt/index.html')
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(response.headers['referrer-policy'], 'no-referrer')
  assert.match(response.headers['content-security-policy'], /worker-src 'none'/u)
  assert.match(response.headers['content-security-policy'], /script-src 'self';/u)
  assert.match(response.headers['content-security-policy'], /form-action 'none'/u)
  assert.match(
    response.headers['content-security-policy'],
    /frame-ancestors http:\/\/127\.0\.0\.1:4319 http:\/\/localhost:4319/u,
  )
  assert.equal(
    (
      await request(path, {
        method: 'HEAD',
        headers: { host: 'localhost:4321' },
      })
    ).status,
    200,
  )
  for (const pathname of [
    '/lab-runners/gantt/',
    '/lab-runners/gantt/index.html',
    '/lab-runners/gantt/sessions/wrong/',
    `${path}?entry=F11`,
    `${path}other`,
    '/lab-runners/gantt/assets/%2fsecret.js',
    '/lab-runners/gantt/assets/index.js?url=evil',
    '/lab-runners/gantt/assets/../sessions/01234567-89ab-4cde-8fab-0123456789ab/',
  ])
    assert.equal((await request(pathname)).status, 404)
  assert.equal((await request(path, { method: 'POST' })).status, 405)
  for (const host of ['evil.localhost:4321', '127.0.0.1:4320', '127.0.0.2:4321'])
    assert.equal((await request(path, { headers: { host } })).status, 403)
  assert.equal(
    (await request(path, { headers: { origin: 'https://attacker.invalid' } })).status,
    403,
  )
  assert.equal((await request(path, { headers: { origin: 'http://127.0.0.1:4319' } })).status, 200)
})
