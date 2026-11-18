import { atom } from 'jotai'
import { toggleStoryRead } from './story-policy.mjs'

// Configurations are shared; values belong to the Provider's Store.
export const counterAtom = atom(0)
export const doubleAtom = atom((get) => get(counterAtom) * 2)
export const storiesAtom = atom([
  { id: 'rss-1', title: '前端性能监控', read: false },
  { id: 'rss-2', title: '测试场景矩阵', read: false },
])
export const unreadAtom = atom((get) => get(storiesAtom).filter((story) => !story.read).length)
export const toggleReadAtom = atom(null, (get, set, id) => {
  set(storiesAtom, toggleStoryRead(get(storiesAtom), id))
})
