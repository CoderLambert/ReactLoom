/** Only locally approved card classes; never interpolate a server supplied tone. */
export function cardClassInputs(state) {
  const tone = state?.tone === 'success' || state?.tone === 'warning' ? `tone-${state.tone}` : null;
  return ['demo-card', {
    'is-selected': state?.selected === true,
    'is-disabled': state?.disabled === true,
  }, tone];
}
