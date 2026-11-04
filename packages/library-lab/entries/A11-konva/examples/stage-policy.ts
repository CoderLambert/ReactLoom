export const MAX_SAMPLE_CARDS = 24;
export function stageWidth(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.max(1, Math.min(4096, Math.floor(raw)));
}
export function canAddCard(count: number): boolean {
  return Number.isSafeInteger(count) && count >= 0 && count < MAX_SAMPLE_CARDS;
}
export function appendCard<T extends {id: string}>(cards: readonly T[], card: T): T[] {
  if (!canAddCard(cards.length) || cards.some(existing => existing.id === card.id)) return cards as T[];
  return [...cards, card];
}
