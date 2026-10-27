export function isCivilDate(value: string): boolean;
export function getUtcInstant(value: string): string | null;
export function allocateEventId(
  sequence: number,
  existingIds: Iterable<string>
): {id: string; nextSequence: number};
