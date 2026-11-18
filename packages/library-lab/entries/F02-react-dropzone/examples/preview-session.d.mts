export function createPreviewSession(): {
  invalidate(): void
  read(file: Blob, accept: (text: string) => void, reject: (error: unknown) => void): Promise<void>
}
