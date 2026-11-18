export type Subscription = {
  name: string
  feedType: 'rss' | 'manual'
  url?: string
  enabled: boolean
}
export type SubscriptionDraft = Partial<Subscription>
export type SubscriptionPayload =
  | { name: string; feedType: 'manual'; enabled: boolean }
  | { name: string; feedType: 'rss'; url: string; enabled: boolean }
export declare const subscriptionSchema: import('@jsonforms/core').JsonSchema
export declare const subscriptionUiSchema: import('@jsonforms/core').UISchemaElement
export declare const basicSchema: import('@jsonforms/core').JsonSchema
export declare const basicUiSchema: import('@jsonforms/core').UISchemaElement
export declare function toSubscriptionPayload(data: SubscriptionDraft): SubscriptionPayload
export declare function validateSubmission(
  payload: SubscriptionPayload,
): { field: 'name' | 'url'; message: string } | null
export declare function toServerError(
  field: 'name' | 'url',
  message: string,
): {
  instancePath: string
  schemaPath: string
  keyword: string
  params: Record<string, never>
  message: string
}
