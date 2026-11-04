export type Job={id:number;title:string}
export function formatJob(job:Job){return `#${job.id} ${job.title}`}
export function unreachableHelper(){return 'unused named export'}
