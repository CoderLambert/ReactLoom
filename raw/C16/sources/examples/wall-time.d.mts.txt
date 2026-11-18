export interface WallResolution {
  wall: string
  zone: string
  offset: string
  instant: string
}
export interface WallCandidate {
  offset: string
  local: string
  instant: string
}
export declare function inspectWallTime(
  value: string,
  zone: string,
): { wall: string; zone: string; candidates: WallCandidate[] }
export declare function resolveWallTime(
  value: string,
  zone: string,
  selectedOffset?: string,
): WallResolution
