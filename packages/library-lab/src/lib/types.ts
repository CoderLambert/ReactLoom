export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Tab = 'demo' | 'docs' | 'agent' | 'related';
export type Level = 'basic' | 'business' | 'advanced';
export type Result = 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED';
export interface Demo { demoId: string; title: string; level: Level; executionKind: 'react' | 'browser-frame' | 'worker' | 'node-ci'; entryPoint?: string; sourceFiles: string[]; capabilities?: string[]; description?: string; }
export interface Entry { schemaVersion: 1; entryId: string; slug: string; name: string; group: Group; summary: string; tags: string[]; contentState: 'missing' | 'imported' | 'reviewed' | 'recreated'; packages: {name: string; version: string | null}[]; references: {title: string; url: string}[]; related: {entryId: string; relation: 'alternative' | 'complements' | 'migration-to'; reason: string}[]; demos: Demo[]; directory: string; guideAvailable: boolean; agentAvailable: boolean; sourceFingerprint: string; verification: Record<string, {status: Result; note?: string; evidence?: string; command?: string; sourceFingerprint?: string}>; }
export interface DemoProps { level: Level; }
export interface SourceMetadata { path: string; sha256: string; bytes: number; }

/** Landing-page record: no SDK manifests or validation claims are downloaded here. */
export interface CatalogEntry { entryId: string; slug: string; name: string; group: Group; summary: string; tags: string[]; contentState: Entry['contentState']; packageNames: string[]; hasDemo: boolean; demoCount: number; sourceFingerprint: string; }
