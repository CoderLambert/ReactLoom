// One handler contract used by both the Node CLI and a future isolated browser runner.
import {http, HttpResponse} from 'msw/http'

const ORIGIN = 'https://library-lab.invalid'

export const endpoints = Object.freeze({
  article: `${ORIGIN}/api/articles/42`,
  verify: `${ORIGIN}/api/verify`,
  retry: `${ORIGIN}/api/retry`,
})

export const handlers = [
  http.get(`${ORIGIN}/api/articles/:id`, ({params}) => {
    return HttpResponse.json({id: String(params.id), title: 'ReactLoom engineering note'}, {status: 200})
  }),
  http.post(endpoints.verify, async ({request}) => {
    const body = await request.json().catch(() => ({}))
    if (typeof body !== 'object' || body === null || !('code' in body) || body.code !== '123456') {
      return HttpResponse.json({error: {code: 'INVALID_CODE', message: '验证码不正确'}}, {status: 422})
    }
    return HttpResponse.json({verified: true}, {status: 200})
  }),
  http.get(endpoints.retry, () => HttpResponse.json({ok: true}, {status: 200})),
]
