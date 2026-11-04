export declare const JSON_RESPONSE_LIMITS: Readonly<{
  catalogIndex: number
  catalogDetail: number
  sourceIndex: number
}>
export declare function readLimitedJsonResponse(
  response: Response,
  maxBytes: number,
): Promise<unknown>
