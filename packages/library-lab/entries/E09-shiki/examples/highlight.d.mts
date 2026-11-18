export type Language = 'typescript' | 'json' | 'html'
export type Token = { content: string; color?: string; fontStyle?: number }
export function highlightSource(source: string, language: Language): Promise<Token[][]>
