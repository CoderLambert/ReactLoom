import { summarize } from './helper';

const root = document.querySelector<HTMLElement>('#root');
const button = document.querySelector<HTMLButtonElement>('#load');
const summary = summarize([4, 5, 6]);
if (root) root.dataset.sum = String(summary.sum);
button?.addEventListener('click', async () => {
  // This is an actual dynamic import. Bundle output must confirm a split chunk.
  const { fibonacci } = await import('./heavy');
  if (root) root.dataset.fibonacci = String(fibonacci(12));
});
