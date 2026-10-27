/** Serializes i18next language changes; only the newest intent may publish UI state. */
export function createLatestLanguageSwitcher(changeLanguage, {onCommit = () => {}, onError = () => {}} = {}) {
  let active = true;
  let running = false;
  let pending = null;

  async function drain() {
    if (running || !active) return;
    running = true;
    try {
      while (active && pending !== null) {
        const target = pending;
        pending = null;
        try {
          // Calling changeLanguage concurrently can reorder the underlying i18n state.
          await changeLanguage(target);
          if (active && pending === null) onCommit(target);
        } catch (error) {
          if (active && pending === null) onError(error);
        }
      }
    } finally {
      running = false;
    }
  }

  return {
    request(language) {
      if (!active) return;
      pending = language;
      void drain();
    },
    dispose() {
      active = false;
      pending = null;
    },
  };
}
