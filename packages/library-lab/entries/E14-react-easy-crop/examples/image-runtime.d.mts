import type { CropAreaPixels } from './crop-policy.mjs'
export function cropToPng(source: string, area: CropAreaPixels): Promise<Blob>
