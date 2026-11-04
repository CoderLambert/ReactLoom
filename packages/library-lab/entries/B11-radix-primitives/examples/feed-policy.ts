export type Feed = {id: string; title: string; unread: number; saved: number; heat: number; updated: number};
export type FeedScope = 'all' | 'unread' | 'saved';
export type FeedSort = 'new' | 'popular';

export function visibleFeeds(feeds: readonly Feed[], scope: FeedScope, sort: FeedSort, pinnedIds: readonly string[]): Feed[] {
  return feeds.filter(feed => scope === 'all' || (scope === 'unread' ? feed.unread > 0 : feed.saved > 0))
    .sort((a, b) => Number(pinnedIds.includes(b.id)) - Number(pinnedIds.includes(a.id)) ||
      (sort === 'popular' ? b.heat - a.heat : b.updated - a.updated) || a.id.localeCompare(b.id));
}

export function deleteFeed(feeds: readonly Feed[], selectedId: string, locked: boolean): Feed[] {
  return locked || !feeds.some(feed => feed.id === selectedId) ? [...feeds] : feeds.filter(feed => feed.id !== selectedId);
}
