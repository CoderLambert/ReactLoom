import type {Demo} from './types';
export const CAPABILITY_DESCRIPTIONS: Readonly<Record<string,string>>;
export function demoRunPolicy(demo: Demo | null | undefined): {mode: 'react' | 'worker' | 'isolated' | 'reproduction' | 'unavailable'; reason: string};
