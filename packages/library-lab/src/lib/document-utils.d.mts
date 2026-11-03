export interface DocumentHeading { depth: 1 | 2 | 3; title: string; line: number; id: string; }
export function resolveDocumentUrl(value: unknown, entryId: string, basePath?: string): string;
export function slugHeading(text: unknown): string;
export function extractDocumentHeadings(markdown: unknown): DocumentHeading[];
export const MAX_MARKDOWN_BYTES: number;
export function readLimitedMarkdownResponse(response: Response): Promise<string>;
