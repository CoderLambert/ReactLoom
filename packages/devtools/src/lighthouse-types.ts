export interface LighthouseReport {
  url: string
  fetchedAt: string
  categories: { id: string; title: string; score: number | null }[]
  metrics: { title: string; value: string }[]
  audits: { title: string; value: string }[]
}

export interface LighthouseState {
  running: boolean
  error: string | null
  report: LighthouseReport | null
}
