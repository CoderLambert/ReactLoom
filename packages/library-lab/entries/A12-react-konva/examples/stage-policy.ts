export const STAGE_WORLD_WIDTH = 620;
export const STAGE_WORLD_HEIGHT = 260;
export const NODE_WIDTH = 132;
export const NODE_HEIGHT = 52;
export const MAX_NODES = 24;

export function measuredStageWidth(clientWidth: number): number {
  return Number.isFinite(clientWidth) && clientWidth > 0
    ? Math.min(4096, Math.max(1, Math.floor(clientWidth))) : 1;
}
export function stageScale(width: number): number {
  return Math.min(1, measuredStageWidth(width) / STAGE_WORLD_WIDTH);
}
export function clampNodePosition(position: {x: number; y: number}): {x: number; y: number} {
  const safe = (value: number, limit: number) => Number.isFinite(value)
    ? Math.min(limit, Math.max(0, Math.round(value))) : 0;
  return {
    x: safe(position.x, STAGE_WORLD_WIDTH - NODE_WIDTH),
    y: safe(position.y, STAGE_WORLD_HEIGHT - NODE_HEIGHT),
  };
}
export function canAddNode(count: number): boolean {
  return Number.isInteger(count) && count >= 0 && count < MAX_NODES;
}
export function newNodePosition(index: number) {
  const ordinal = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  return clampNodePosition({x: 24 + (ordinal % 4) * 140, y: 24 + (Math.floor(ordinal / 4) % 3) * 64});
}
