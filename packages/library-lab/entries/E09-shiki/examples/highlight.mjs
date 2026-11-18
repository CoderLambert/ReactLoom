import { codeToTokens } from 'shiki/bundle/web'
export async function highlightSource(source, language) {
  const result = await codeToTokens(source, { lang: language, theme: 'github-light' })
  return result.tokens.map((line) =>
    line.map(({ content, color, fontStyle }) => ({ content, color, fontStyle })),
  )
}
