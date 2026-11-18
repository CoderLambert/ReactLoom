import clsx from 'clsx'
import { extendTailwindMerge, getDefaultConfig, twJoin, twMerge } from 'tailwind-merge'

export const DEFAULT_BASE = 'rounded-lg border px-3 py-2 bg-slate-100'
export const DEFAULT_CALLER = 'pr-8'
export const BASE_VARIANTS = {
  compact: '',
  comfortable: 'px-7 py-5',
}
export const PRESETS = [
  {
    id: 'component',
    title: '组件默认值 + 变体 + 调用者',
    base: DEFAULT_BASE,
    caller: DEFAULT_CALLER,
  },
  { id: 'caller', title: '调用者覆盖间距与背景', base: DEFAULT_BASE, caller: 'px-1 bg-blue-100' },
  { id: 'same', title: '同组 px 覆盖', base: 'px-2', caller: 'px-6' },
  { id: 'axis-first', title: '先水平再右侧', base: 'px-3', caller: 'pr-4' },
  { id: 'side-first', title: '先右侧再水平', base: 'pr-4', caller: 'px-3' },
  { id: 'responsive', title: '相同断点与默认值', base: 'md:p-2 p-4', caller: 'md:p-6' },
  {
    id: 'hover',
    title: '相同 hover 与静止背景',
    base: 'bg-slate-100 hover:bg-red-500',
    caller: 'hover:bg-green-500',
  },
  {
    id: 'custom',
    title: '未知类与自定义 px 规则',
    base: 'c21-pad-compact',
    caller: 'c21-pad-roomy',
  },
]

const defaultConfig = getDefaultConfig()
export const paddingConflicts = {
  p: defaultConfig.conflictingClassGroups.p,
  px: defaultConfig.conflictingClassGroups.px,
  pr: defaultConfig.conflictingClassGroups.pr || [],
}

// Our two source-owned CSS utilities set padding-inline; put them in the real px group.
// No custom class-group recognition is inferred from a name or CSS at runtime.
const mergeWithWorkspacePadding = extendTailwindMerge({
  extend: { classGroups: { px: ['c21-pad-compact', 'c21-pad-roomy'] } },
})

export function cn(...values) {
  return twMerge(clsx(...values))
}

export function calculateMerge({ base, caller, selected, size, custom }) {
  const variants = clsx(selected && 'bg-green-100', BASE_VARIANTS[size])
  const composed = clsx(base, variants, caller)
  return {
    inputs: { base, variants, caller },
    joined: twJoin(base, variants, caller),
    composed,
    defaultMerged: twMerge(composed),
    merged: custom ? mergeWithWorkspacePadding(composed) : twMerge(composed),
    mode: custom ? 'custom-px' : 'default',
  }
}
