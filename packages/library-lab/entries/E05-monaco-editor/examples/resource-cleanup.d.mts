export interface OwnedResourceSlots {
  observer?: {disconnect(): void};
  markerListener?: {dispose(): void};
  contentListener?: {dispose(): void};
  editor?: {dispose(): void};
  model?: {dispose(): void};
  releaseWorkers?: () => void;
}
export interface CleanupFailure {step: string; message: string}
export declare function createOwnedResourceCleanup(
  resources: OwnedResourceSlots,
  onFailure?: (failures: CleanupFailure[]) => void,
): () => CleanupFailure[];
