export function createFileCheck(): {
  begin(): number
  current(id: number): boolean
  dispose(): void
}
