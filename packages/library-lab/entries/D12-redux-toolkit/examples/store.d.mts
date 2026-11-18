import type { EnhancedStore, PayloadActionCreator, Slice } from '@reduxjs/toolkit'
export type Feed = { id: string; title: string; read: boolean }
export type FeedState = {
  counter: number
  feeds: Feed[]
  activeRequest: string | null
  result: string
  ignored: number
}
export declare function initialFeedState(): FeedState
export declare const feedsSlice: Slice<FeedState>
export declare const actions: {
  increment: PayloadActionCreator<void>
  addFeed: PayloadActionCreator<Feed>
  toggleRead: PayloadActionCreator<string>
  startRequest: PayloadActionCreator<string>
  cancelRequest: PayloadActionCreator<void>
  finishRequest: PayloadActionCreator<{ id: string; value: string }>
  reset: PayloadActionCreator<void>
}
export declare function createFeedStore(): EnhancedStore<{ feeds: FeedState }>
