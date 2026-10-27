/**
 * Row-scoped optimistic cache patches. A token identifies which mutation owns
 * a draft: late failure/success callbacks must never replace a newer draft.
 * Server revision is the CAS precondition, not a UI-generated version.
 */
export function optimisticRow(page, {id, enabled, expectedRev, token}) {
  if (!page) return page;
  let changed = false;
  const items = page.items.map(row => {
    if (row.id !== id || row.rev !== expectedRev || row.optimisticToken !== undefined) return row;
    changed = true;
    return {...row, enabled, optimisticToken: token};
  });
  return changed ? {...page, items} : page;
}

/** Restore only the affected row if this operation still owns that draft. */
export function rollbackRow(page, {id, token, previous}) {
  if (!page || !previous) return page;
  let changed = false;
  const items = page.items.map(row => {
    if (row.id !== id || row.optimisticToken !== token) return row;
    changed = true;
    return {...previous};
  });
  return changed ? {...page, items} : page;
}

/** Confirm only this operation's draft; never replace a newer optimistic row. */
export function commitRow(page, {id, token, saved}) {
  if (!page) return page;
  let changed = false;
  const items = page.items.map(row => {
    if (row.id !== id || row.optimisticToken !== token) return row;
    changed = true;
    return {...saved};
  });
  return changed ? {...page, items} : page;
}
