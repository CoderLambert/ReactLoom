/** Stable, field-only identity for a submitted RHF snapshot, not a security token. */
export function fingerprintDraft(draft) {
  if (typeof draft?.group !== 'string' || !Array.isArray(draft.sources)) return null;
  const sourceValues = [];
  for (const source of draft.sources) {
    if (typeof source?.name !== 'string' || typeof source.url !== 'string') return null;
    sourceValues.push([source.name, source.url]);
  }
  return JSON.stringify([draft.group, sourceValues]);
}

/** Abort, identity epoch and current values must all agree before a response can write. */
export function canApplySubmitResult({expectedFingerprint, currentFingerprint, expectedEpoch, currentEpoch, aborted}) {
  return typeof expectedFingerprint === 'string' && expectedFingerprint === currentFingerprint &&
    expectedEpoch === currentEpoch && aborted === false;
}

/** Some IMEs emit Enter with isComposing=false / keyCode=229 as composition ends. */
export function shouldBlockCompositionEnter({key, composing = false, isComposing = false, keyCode = 0,
  sinceCompositionEndMs = Number.POSITIVE_INFINITY}) {
  return key === 'Enter' && (composing || isComposing || keyCode === 229 ||
    (sinceCompositionEndMs >= 0 && sinceCompositionEndMs < 80));
}
