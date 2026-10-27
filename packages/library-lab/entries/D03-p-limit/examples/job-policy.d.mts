export type JobState = 'queued' | 'running' | 'done' | 'error' | 'cancelled';
export interface Job {id: number; state: JobState}
export function transitionJob(jobs: Job[], id: number, next: JobState): Job[];
export function cancelUnsettledJobs(jobs: Job[]): Job[];
