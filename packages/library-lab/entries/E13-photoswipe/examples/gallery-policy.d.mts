export type GalleryImage = { id: number; src: string; alt: string; width: number; height: number };
export function visibleArtwork<T extends GalleryImage>(items: T[], level: 'basic' | 'business' | 'advanced', extra?: boolean): T[];
