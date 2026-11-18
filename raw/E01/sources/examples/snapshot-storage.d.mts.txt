export const DRAFT_KEY: string
export function saveDraft(storage: Pick<Storage, 'setItem'>, document: unknown): number
export function readDraft(storage: Pick<Storage, 'getItem'>): unknown
