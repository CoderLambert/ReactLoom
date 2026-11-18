export type Source = 'official' | 'community' | 'other'
export type Article = { url: string; title: string; source: Source; publishedAt: string }
export const seed: unknown[]
export function canonicalUrl(raw: string): string
export function normalizeArticle(raw: unknown): Article
export function makeDigest(
  raw: readonly unknown[],
  pageSize: number,
): {
  accepted: Article[]
  newestFirst: Article[]
  articles: Article[]
  bySource: Record<Source, Article[]>
  pages: Article[][]
  rejected: { index: number; reason: string }[]
}
