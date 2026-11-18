import type { ClassValue } from 'clsx'
export declare const DEFAULT_BASE: string
export declare const DEFAULT_CALLER: string
export declare const BASE_VARIANTS: { compact: string; comfortable: string }
export declare const PRESETS: { id: string; title: string; base: string; caller: string }[]
export declare const paddingConflicts: {
  p: readonly string[]
  px: readonly string[]
  pr: readonly string[]
}
export interface MergeInput {
  base: string
  caller: string
  selected: boolean
  size: 'compact' | 'comfortable'
  custom: boolean
}
export declare function cn(...values: ClassValue[]): string
export declare function calculateMerge(input: MergeInput): {
  inputs: { base: string; variants: string; caller: string }
  joined: string
  composed: string
  defaultMerged: string
  merged: string
  mode: 'custom-px' | 'default'
}
