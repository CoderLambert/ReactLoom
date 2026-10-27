export interface MonacoWorkerHost {
  MonacoEnvironment?: {getWorker(workerId: string, label: string): Worker};
}
export declare function acquireWorkerEnvironment(
  host: MonacoWorkerHost,
  factory: () => NonNullable<MonacoWorkerHost['MonacoEnvironment']>,
): () => void;
