export function createTaskOwner(): {
  begin(): number | null
  isCurrent(id: number): boolean
  isBusy(): boolean
  attachCancel(id: number, callback: () => void): void
  clearCancel(id: number): void
  invalidate(): void
  finish(id: number): void
}
export function assertPNGBlob(value: unknown): Blob
