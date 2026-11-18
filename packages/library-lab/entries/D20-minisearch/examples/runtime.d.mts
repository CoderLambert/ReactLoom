import MiniSearch from 'minisearch'
export type Group = '技术' | '产品' | '开源'
export type Doc = { id: string; title: string; summary: string; group: Group }
export const initialDocs: Doc[]
export function buildMiniIndex(documents: Doc[]): MiniSearch<Doc>
export function updateFirstDocument(documents: Doc[]): Doc[]
