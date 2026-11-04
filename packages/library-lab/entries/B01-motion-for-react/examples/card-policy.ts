/** Domain list operations independent of Motion's visual lifecycle. */
export const MAX_MOTION_CARDS = 12;
export type Identified = {id: number};

export function appendUniqueCard<T extends Identified>(cards: readonly T[], candidate: T): T[] {
  if (cards.length >= MAX_MOTION_CARDS || cards.some(card => card.id === candidate.id)) return [...cards];
  return [...cards, candidate];
}

export function archiveCard<T extends Identified>(cards: readonly T[], id: number): T[] {
  return cards.filter(card => card.id !== id);
}

export function moveFirstToEnd<T>(cards: readonly T[]): T[] {
  return cards.length > 1 ? [...cards.slice(1), cards[0]] : [...cards];
}
