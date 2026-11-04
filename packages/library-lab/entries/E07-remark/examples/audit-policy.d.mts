export type MarkdownAudit = {headings: string[]; links: {url: string; safe: boolean}[]; nodes: number};
export declare function safeReference(value: unknown): boolean;
export declare function auditMarkdownTree(root: unknown): MarkdownAudit;
