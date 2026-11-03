export interface MonacoWorkerHost {
  // The SDK permits an absent hook and asynchronous Worker creation on an existing host.
  MonacoEnvironment?: typeof globalThis.MonacoEnvironment;
}
export declare function acquireWorkerEnvironment(
  host: MonacoWorkerHost,
  factory: () => {getWorker(workerId: string, label: string): Worker},
): () => void;
