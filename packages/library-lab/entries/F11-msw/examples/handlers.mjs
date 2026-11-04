// Share one real-MSW handler factory across Node and a same-origin scoped iframe.
import {http, HttpResponse} from 'msw/http'
import {scenarioEndpoints, NODE_SCENARIO_BASE} from './routes.mjs'

export const endpoints = scenarioEndpoints(NODE_SCENARIO_BASE)

export function createHandlers(urls) {
  return [
    http.get(urls.articlePattern, ({params}) => {
      return HttpResponse.json({id: String(params.id), title: 'ReactLoom engineering note'}, {status: 200})
    }),
    http.post(urls.verify, async ({request}) => {
      const body = await request.json().catch(() => ({}))
      if (typeof body !== 'object' || body === null ||
          !('code' in body) || body.code !== '123456') {
        return HttpResponse.json(
          {error: {code: 'INVALID_CODE', message: '验证码不正确'}}, {status: 422})
      }
      return HttpResponse.json({verified: true}, {status: 200})
    }),
    http.get(urls.retry, () => HttpResponse.json({ok: true}, {status: 200})),
  ]
}

// Node CLI deliberately uses an unresolvable fixture host; unmatched requests must fail.
export const handlers = createHandlers(endpoints)
