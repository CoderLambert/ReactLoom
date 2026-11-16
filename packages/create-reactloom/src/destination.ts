import { mkdir } from 'node:fs/promises'

/** Claim the final scaffold directory without an existence-check/write race. */
export async function claimScaffoldDestination(directory: string): Promise<void> {
  try {
    await mkdir(directory)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(`Destination already exists: ${directory}`)
    }
    throw error
  }
}
