import {describe, it, expect} from 'vitest'
import {normalizeFeedURL} from './domain'
describe('real Vitest basic assertions',()=>{
  it.each([
    ['https://example.org/rss#section','https://example.org/rss'],
    ['https://example.org/feeds?q=react','https://example.org/feeds?q=react'],
  ])('normalizes safe source %s', (input, expected)=>{
    expect(normalizeFeedURL(input)).toBe(expected)
  })
  it.each(['javascript:alert(1)','http://example.org/rss','https://me:token@example.org/rss','not-a-url'])(
    'rejects unsafe URL %s', input=>expect(()=>normalizeFeedURL(input)).toThrow()
  )
})
