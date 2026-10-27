/** Pure guards for cmdk's keyboard path; no global listeners or browser state. */
export type PaletteKey = {
  key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean;
  shiftKey?: boolean; isComposing?: boolean; keyCode?: number;
};

export function shouldTogglePalette(event: PaletteKey, editableTarget: boolean, alreadyOpen: boolean): boolean {
  return event.key.toLowerCase() === 'k' && Boolean(event.ctrlKey || event.metaKey) &&
    !event.shiftKey && !event.altKey && !event.isComposing && event.keyCode !== 229 &&
    (alreadyOpen || !editableTarget);
}

export function shouldSuppressCommandEnter(
  event: Pick<PaletteKey,'key' | 'isComposing' | 'keyCode'>,
  composing: boolean, pendingCompositionCommit: boolean,
): boolean {
  return event.key === 'Enter' && (composing || pendingCompositionCommit ||
    Boolean(event.isComposing) || event.keyCode === 229);
}
