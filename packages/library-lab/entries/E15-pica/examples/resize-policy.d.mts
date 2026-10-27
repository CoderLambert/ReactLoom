export const MAX_IMAGE_BYTES: number;
export const MAX_IMAGE_PIXELS: number;
export function checkSourceFile<T extends {type: string; size: number}>(file: T): T;
export function checkSourcePixels(width: number, height: number): void;
export function targetDimensions(width: number, height: number, longEdge: number): {width: number; height: number};
