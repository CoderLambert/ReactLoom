// Next.js masks Server Component errors in production, but Client Component
// errors retain their original message. Never render arbitrary error text
// in a production fallback (it may include internal data or user content).
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export function errorMessageForDisplay(error: unknown, nodeEnv: string | undefined): string {
  if (nodeEnv === 'production') return GENERIC_ERROR_MESSAGE
  return error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
}
