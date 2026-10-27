export type ReplyLevel = 'basic' | 'business' | 'advanced';
export function recentUserText(messages: readonly {role: string; content?: readonly {type: string; text?: string}[]}[]): string;
export function makeLocalReply(messages: readonly {role: string; content?: readonly {type: string; text?: string}[]}[], level: ReplyLevel): string;
export function cumulativeChunks(text: string, width?: number): string[];
