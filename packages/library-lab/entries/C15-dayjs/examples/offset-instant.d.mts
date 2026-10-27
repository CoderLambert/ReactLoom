export interface ExplicitZonedInstant { zone: string; wall: string; offset: string; instant: string }
export declare function resolveExplicitZonedInstant(input: string, zone: string): ExplicitZonedInstant;
