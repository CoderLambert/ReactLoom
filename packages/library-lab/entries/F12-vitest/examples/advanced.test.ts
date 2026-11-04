import {afterEach,describe,expect,it,vi} from 'vitest'
import {createLatestRequest} from './domain'
afterEach(()=>vi.useRealTimers())
describe('latest request wins with explicit signal, not arbitrary sleeps',()=>{
  it('drops an older response after next call cancels its generation',async()=>{
    vi.useFakeTimers()
    let call=0
    const manager=createLatestRequest<string>(signal=>new Promise(resolve=>{
      const number=++call
      const timer=setTimeout(()=>resolve('value-'+number),number===1?100:10)
      signal.addEventListener('abort',()=>{clearTimeout(timer);resolve('aborted-'+number)},{once:true})
    }))
    const old=manager.run()
    const newest=manager.run()
    await vi.advanceTimersByTimeAsync(110)
    expect(await old).toBeNull()
    expect(await newest).toBe('value-2')
  })
  it('cancel rejects stale fulfillment even if backend ignores abort',async()=>{
    let complete: ((s:string)=>void)|undefined
    const manager=createLatestRequest<string>(()=>new Promise(resolve=>{complete=resolve}))
    const pending=manager.run()
    manager.cancel()
    complete?.('late')
    expect(await pending).toBeNull()
  })
})

describe('active failure and cancellation ownership',()=>{
  it('propagates an active error but ignores the same error after cancellation',async()=>{
    let rejectLoad!: (reason: Error)=>void
    const manager=createLatestRequest<string>(()=>new Promise((_,reject)=>{rejectLoad=reject}))
    const active=manager.run()
    rejectLoad(new Error('real failure'))
    await expect(active).rejects.toThrow('real failure')
    const stale=manager.run()
    manager.cancel()
    rejectLoad(new Error('late failure'))
    await expect(stale).resolves.toBeNull()
  })
})
