export interface MarkdownFixture {
  title: string
  objective: string
  chunks: readonly string[]
}
export const fixtures: Record<'basic' | 'business', MarkdownFixture>
