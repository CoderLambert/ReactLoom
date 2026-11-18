import Ajv from 'ajv'

// Schemas are trusted application code. Never compile an arbitrary remotely supplied schema.
export const feedSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'url'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 40, pattern: '^[a-z0-9-]+$' },
    title: { type: 'string', minLength: 2, maxLength: 80 },
    url: { type: 'string', minLength: 9, pattern: '^[Hh][Tt][Tt][Pp][Ss]://' },
  },
} as const
export const batchSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['team', 'feeds'],
  properties: {
    team: { type: 'string', minLength: 1 },
    feeds: { type: 'array', minItems: 1, maxItems: 5, uniqueItems: true, items: feedSchema },
  },
} as const
const maxConcurrentSchema = { type: 'integer', minimum: 1, maximum: 8 } as const
export const windowSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['enabled'],
  properties: { enabled: { type: 'boolean' }, maxConcurrent: maxConcurrentSchema },
  if: { properties: { enabled: { const: true } }, required: ['enabled'] },
  // biome-ignore lint/suspicious/noThenProperty: JSON Schema conditional keyword; this object is not a thenable.
  then: { properties: { maxConcurrent: maxConcurrentSchema }, required: ['maxConcurrent'] },
} as const
export const schemas = { basic: feedSchema, business: batchSchema, advanced: windowSchema }

export function createValidators() {
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
  })
  return {
    basic: ajv.compile(feedSchema),
    business: ajv.compile(batchSchema),
    advanced: ajv.compile(windowSchema),
  }
}
