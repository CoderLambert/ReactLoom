/** Mermaid uses module-wide configuration and DOM rendering state.
 * Serialize parse+render jobs; skip jobs invalidated while queued, and never
 * commit a result after the owner changes diagram or unmounts. */
let tail: Promise<void> = Promise.resolve();

export function queueMermaidRender<T>(
  isCurrent: () => boolean,
  render: () => Promise<T>,
  commit: (value: T) => void,
  reportError: (error: unknown) => void,
): Promise<void> {
  const run = async () => {
    if (!isCurrent()) return;
    try {
      const result = await render();
      if (isCurrent()) commit(result);
    } catch (error) {
      if (isCurrent()) reportError(error);
    }
  };
  const task = tail.then(run, run);
  tail = task.then(() => undefined, () => undefined);
  return task;
}
