import type { OfficialReadme } from './types'
export function validateOfficialSources(value: unknown): string[]
export function resolveOfficialReadmeUrl(
  value: string,
  readme: OfficialReadme,
  headingIds?: string[],
): string
