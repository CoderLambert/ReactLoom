export type Site = {
  id: string
  name: string
  position: [number, number]
  healthy: boolean
  volume: number
}
export const SITES: Site[] = [
  { id: 'b1', name: '北京', position: [116.4, 39.9], healthy: true, volume: 42 },
  { id: 't1', name: '天津', position: [117.2, 39.13], healthy: false, volume: 31 },
  { id: 'sjz', name: '石家庄', position: [114.5, 38.05], healthy: true, volume: 24 },
  { id: 'ty', name: '太原', position: [112.55, 37.87], healthy: true, volume: 39 },
]
export function sample(count: number): Site[] {
  const length = Number.isSafeInteger(count) ? Math.min(1200, Math.max(0, count)) : 0
  return Array.from({ length }, (_, index) => ({
    id: `local-${index}`,
    name: `样本 ${index + 1}`,
    position: [112 + ((index * 97) % 1000) / 180, 36.5 + ((index * 31) % 1000) / 250],
    healthy: index % 4 !== 0,
    volume: 10 + ((index * 13) % 90),
  }))
}
export const PAGE_SIZE = 12
export function tablePage(rows: readonly Site[], requested: number) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const page = Math.min(pages - 1, Math.max(0, Number.isSafeInteger(requested) ? requested : 0))
  return { page, pages, rows: rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) }
}
