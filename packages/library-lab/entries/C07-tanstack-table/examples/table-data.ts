import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'

export type Feed = {
  id: string
  title: string
  category: '技术' | '资讯' | '商业'
  subscribers: number
  status: 'active' | 'paused'
}
export const feedSeed: Feed[] = Array.from({ length: 18 }, (_, i) => ({
  id: `feed-${String(100 + i)}`,
  title: `${['Frontend Engineering', 'Platform Weekly', 'AI Systems', 'News Digest', 'Open Source'][i % 5]} #${i + 1}`,
  category: (['技术', '资讯', '商业'] as const)[i % 3],
  subscribers: 100 + i * 31,
  status: i % 4 === 0 ? 'paused' : 'active',
}))

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { text: sortFn_text },
})
