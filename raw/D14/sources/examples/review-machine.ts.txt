import { assign, setup } from 'xstate'
import { isValidRejection, normalizeRejectionReason } from './review-policy.mjs'

export type ReviewEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE' }
  | { type: 'REJECT'; reason: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
type ReviewContext = { retries: number; reason: string }

export const reviewMachine = setup({
  types: { context: {} as ReviewContext, events: {} as ReviewEvent },
  guards: {
    hasRetryBudget: ({ context }) => context.retries < 2,
    hasRejectionReason: ({ event }) => isValidRejection(event),
  },
  actions: {
    saveReason: assign({
      reason: ({ event }) =>
        event.type === 'REJECT' ? normalizeRejectionReason(event.reason) : '',
    }),
    incrementRetries: assign({ retries: ({ context }) => context.retries + 1, reason: '' }),
    clearReview: assign({ retries: 0, reason: '' }),
  },
}).createMachine({
  id: 'rss-review',
  initial: 'draft',
  context: { retries: 0, reason: '' },
  states: {
    draft: { on: { SUBMIT: 'reviewing' } },
    reviewing: {
      on: {
        APPROVE: 'published',
        REJECT: { target: 'rejected', guard: 'hasRejectionReason', actions: 'saveReason' },
      },
    },
    rejected: {
      on: {
        RETRY: { target: 'reviewing', guard: 'hasRetryBudget', actions: 'incrementRetries' },
        RESET: { target: 'draft', actions: 'clearReview' },
      },
    },
    published: { on: { RESET: { target: 'draft', actions: 'clearReview' } } },
  },
})
