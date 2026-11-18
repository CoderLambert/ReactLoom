export type Story = { id: string; title: string; read: boolean }
export type FeedState = { section: { name: string; stories: Story[] }; revision: number }
export const initialState: FeedState
export function renameFeed(state: FeedState, title: string): FeedState
export function toggleStory(state: FeedState, id: string): FeedState
export function markAllRead(state: FeedState): FeedState
export function referenceReport(
  before: FeedState,
  after: FeedState,
): {
  rootShared: boolean
  sectionShared: boolean
  storiesArrayShared: boolean
  stories: { id: string; shared: boolean }[]
}
