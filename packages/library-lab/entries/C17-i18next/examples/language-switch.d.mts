export type Language = 'zh' | 'en';
export function createLatestLanguageSwitcher(
  changeLanguage: (language: Language) => Promise<unknown>,
  handlers?: {onCommit?: (language: Language) => void; onError?: (error: unknown) => void},
): {request(language: Language): void; dispose(): void};
