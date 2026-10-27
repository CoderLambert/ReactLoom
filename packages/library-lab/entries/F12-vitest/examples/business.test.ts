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
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(signal)
  })
  it('rejects malformed 200 response rather than silently passing',async ()=>{
    await expect(verifyCode(async()=>new Response('{"unknown":42}',{status:200}),new AbortController().signal))
      .rejects.toThrow('Invalid JSON shape')
  })
})

describe('abort boundaries during request and JSON parsing',()=>{
  it('never calls the HTTP layer for an already aborted signal',async()=>{
    const controller=new AbortController()
    controller.abort()
    const request=vi.fn(async()=>new Response('{"message":"wrong"}',{status:200}))
    await expect(verifyCode(request,controller.signal)).rejects.toMatchObject({name:'AbortError'})
    expect(request).not.toHaveBeenCalled()
  })
  it('does not accept a late successful JSON parse after cancellation',async()=>{
    const controller=new AbortController()
    let entered!: () => void
    let deliver!: (data: unknown) => void
    const parsing=new Promise<void>(resolve=>{entered=resolve})
    const request=vi.fn(async()=>{
      return {
        status:200,
        ok:true,
        json:()=>{
          entered()
          return new Promise<unknown>(resolve=>{deliver=resolve})
        },
      } as Response
    })
    const pending=verifyCode(request,controller.signal)
    await parsing
    controller.abort()
    deliver({message:'late-success'})
    await expect(pending).rejects.toMatchObject({name:'AbortError'})
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('checks cancellation after parsing an invalid 422 response',async()=>{
    const controller=new AbortController()
    let release!: (data: unknown) => void
    let parsing!: () => void
    const entered=new Promise<void>(resolve=>{parsing=resolve})
    const request=async()=>({
      status:422,ok:false,
      json:()=>{parsing();return new Promise<unknown>(resolve=>{release=resolve})},
    } as Response)
    const pending=verifyCode(request,controller.signal)
    await entered
    controller.abort()
    release({code:'OTP_EXPIRED'})
    await expect(pending).rejects.toMatchObject({name:'AbortError'})
  })
})
