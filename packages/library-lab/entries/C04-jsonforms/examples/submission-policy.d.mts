export type Subscription = {name: string; feedType: 'rss'|'manual'; url?: string; enabled: boolean};
export type SubscriptionPayload =
  | {name: string; feedType: 'manual'; enabled: boolean}
  | {name: string; feedType: 'rss'; url: string; enabled: boolean};
export declare const subscriptionSchema: import('@jsonforms/core').JsonSchema;
export declare function toSubscriptionPayload(data: Subscription): SubscriptionPayload;
export declare function validateSubmission(payload: SubscriptionPayload): {field: 'name'|'url'; message: string}|null;
export declare function toServerError(field: 'name'|'url', message: string): {
  instancePath: string; schemaPath: string; keyword: string; params: Record<string, never>; message: string;
};
