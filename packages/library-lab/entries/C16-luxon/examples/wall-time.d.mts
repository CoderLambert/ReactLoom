export interface WallResolution { wall: string; zone: string; offset: string; instant: string }
export declare function resolveWallTime(value: string, zone: string, selectedOffset?: string): WallResolution;
