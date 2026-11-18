export type Location = {
  id: string
  label: string
  city: string
  center: [number, number]
  status: 'online' | 'paused'
}

/** Original local fixture, not institution locations or a map-provider response. */
export const INITIAL_LOCATIONS: Location[] = [
  { id: 'sea', label: '技术 RSS', city: 'Seattle', center: [47.6062, -122.3321], status: 'online' },
  {
    id: 'sfo',
    label: '产品更新',
    city: 'San Francisco',
    center: [37.7749, -122.4194],
    status: 'online',
  },
  { id: 'nyc', label: '行业资讯', city: 'New York', center: [40.7128, -74.006], status: 'paused' },
]

export function initialLocations(): Location[] {
  return INITIAL_LOCATIONS.map((location) => ({ ...location, center: [...location.center] }))
}
