import { produce } from 'immer'

export const initialState = {
  section: {
    name: '前端工程',
    stories: [
      { id: 's1', title: 'React 19 生命周期', read: false },
      { id: 's2', title: '异步任务队列实践', read: false },
    ],
  },
  revision: 1,
}

export function renameFeed(state, title) {
  return produce(state, (draft) => {
    const name = title.trim() || '未命名分类'
    if (draft.section.name !== name) {
      draft.section.name = name
      draft.revision++
    }
  })
}

export function toggleStory(state, id) {
  return produce(state, (draft) => {
    const story = draft.section.stories.find((item) => item.id === id)
    if (story) {
      story.read = !story.read
      draft.revision++
    }
  })
}

export function markAllRead(state) {
  return produce(state, (draft) => {
    let changed = false
    for (const story of draft.section.stories) {
      if (!story.read) {
        story.read = true
        changed = true
      }
    }
    if (changed) draft.revision++
  })
}

// Report comparisons against the immediately preceding snapshot, by stable ID.
export function referenceReport(before, after) {
  return {
    rootShared: before === after,
    sectionShared: before.section === after.section,
    storiesArrayShared: before.section.stories === after.section.stories,
    stories: before.section.stories.map((story) => ({
      id: story.id,
      shared: story === after.section.stories.find((item) => item.id === story.id),
    })),
  }
}
