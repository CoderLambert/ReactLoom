import {describe, it, expect, vi} from 'vitest'
import {verifyCode} from './domain'
const scenarios = [
  {label:'success',status:200,body:{message:'验证码通过'},expected:{kind:'ok',message:'验证码通过'}},
  {label:'invalid',status:422,body:{code:'OTP_EXPIRED'},expected:{kind:'invalid',code:'OTP_EXPIRED'}},
  {label:'temporary-outage',status:503,body:{message:'retry'},expected:{kind:'retry',after:3}},
] as const
describe('scenario matrix: real Vitest, injected fake business HTTP',()=>{
  it.each(scenarios)('$label ($status)',async ({status,body,expected})=>{
    const request=vi.fn(async (_signal:AbortSignal)=>new Response(JSON.stringify(body),{
      status,headers:{'content-type':'application/json'}
    }))
    const signal=new AbortController().signal
    expect(await verifyCode(request,signal)).toEqual(expected)
    expect(request).toHaveBeenCalledExactlyOnceWith(signal)
  })
  it('rejects malformed 200 response rather than silently passing',async ()=>{
    await expect(verifyCode(async()=>new Response('{"unknown":42}',{status:200}),new AbortController().signal))
      .rejects.toThrow('Invalid JSON shape')
  })
})
