export const MAX_SPRING_ARTICLES = 12;
export type Identified = {id: string};
export function appendUniqueArticle<T extends Identified>(items: readonly T[], candidate: T): T[] {
  if (items.length >= MAX_SPRING_ARTICLES || items.some(item => item.id === candidate.id)) return [...items];
  return [...items, candidate];
}
/** Move focus only when the removed control itself actually owns keyboard focus. */
export function shouldRestoreAfterRemoval(removedButtonFocused: boolean): boolean {
  return removedButtonFocused;
}
