import { mountCalculator } from './view'

// No top-level import of heavy.ts. The callback is invoked only after a valid click.
mountCalculator('dynamic import：点击后才调用 import()', () => import('./heavy'))
