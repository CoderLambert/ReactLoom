export const MAX_SPRING_ARTICLES = 12;
export type Identified = {id: string};
export function appendUniqueArticle<T extends Identified>(items: readonly T[], candidate: T): T[] {
  if (items.length >= MAX_SPRING_ARTICLES || items.some(item => item.id === candidate.id)) return [...items];
  return [...items, candidate];
}
/** Decide where to focus after React commits the removal; count refers to remaining items. */
export function focusDestinationAfterRemoval(removedButtonFocused: boolean, remainingItemCount: number): 'none' | 'add' | 'reset' {
  if (!removedButtonFocused) return 'none';
  // The Add control is disabled at capacity; use the always-enabled Reset as fallback.
  return remainingItemCount >= MAX_SPRING_ARTICLES ? 'reset' : 'add';
}
