import type {Feed} from './policy.mjs';
export type Report = {accepted: Feed[]; rejected: string[]; total: number; parserErrors: string[]; escapedCsv: string};
export function reportCSV(source: string): Report;
