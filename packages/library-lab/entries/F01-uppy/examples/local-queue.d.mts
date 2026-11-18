import type Uppy from '@uppy/core'
export type LocalFile = { id: string; name: string; size: number; type: string }
export type BatchSummary = {
  added: number
  notAdded: number
  errors: string[]
  fatal: string | null
}
export declare function createLocalQueue(id: string, options?: { infoTimeout?: number }): Uppy
export declare function localFiles(uppy: Uppy): LocalFile[]
export declare function bindLocalQueue(
  uppy: Uppy,
  onFiles: (files: LocalFile[]) => void,
  onRestriction: (error: Error) => void,
): () => void
export declare function addLocalFiles(uppy: Uppy, inputs: File[]): BatchSummary
