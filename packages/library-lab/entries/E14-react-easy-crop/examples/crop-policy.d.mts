export type CropAreaPixels = { x: number; y: number; width: number; height: number };
export const MAX_IMAGE_BYTES: number;
export const MAX_IMAGE_PIXELS: number;
export const MAX_OUTPUT_PIXELS: number;
export function checkImageFile<T extends {type: string; size: number}>(file: T): T;
export function checkImageDimensions(width: number, height: number): {width: number; height: number};
export function checkCropArea(area: CropAreaPixels, imageWidth: number, imageHeight: number): CropAreaPixels;
