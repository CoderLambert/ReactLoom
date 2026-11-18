import { configureStore, createSlice } from '@reduxjs/toolkit'

export function initialFeedState() {
  return { counter: 0, feeds: [], activeRequest: null, result: '', ignored: 0 }
}

export const feedsSlice = createSlice({
  name: 'labFeeds',
  initialState: initialFeedState(),
  reducers: {
    increment(state) {
      state.counter += 1
    },
    addFeed(state, action) {
      if (!state.feeds.some((feed) => feed.id === action.payload.id))
        state.feeds.push(action.payload)
    },
    toggleRead(state, action) {
      const feed = state.feeds.find((item) => item.id === action.payload)
      if (feed) feed.read = !feed.read
    },
    startRequest(state, action) {
      state.activeRequest = action.payload
    },
    cancelRequest(state) {
      state.activeRequest = null
    },
    finishRequest(state, action) {
      if (state.activeRequest !== action.payload.id) {
        state.ignored += 1
        return
      }
      state.result = action.payload.value
      state.activeRequest = null
    },
    reset() {
      return initialFeedState()
    },
  },
})
export const actions = feedsSlice.actions
export function createFeedStore() {
  return configureStore({ reducer: { feeds: feedsSlice.reducer }, devTools: false })
}
