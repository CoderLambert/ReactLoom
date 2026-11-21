import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { describe, expect, it } from 'vitest'
import { i18n } from '../../lib/i18n'
import { loginValidationErrorKeys } from './login-validation'
import { loginSchema } from './schema'

const resolver = standardSchemaResolver(loginSchema)
const options = { fields: {}, shouldUseNativeValidation: false } as const

async function validate(email: string, password: string) {
  const result = await resolver({ email, password }, {}, options)
  return loginValidationErrorKeys(result.errors)
}

describe('mobile login validation feedback', () => {
  it('shows field messages for invalid email and password', async () => {
    expect(await validate('not-an-email', 'short')).toEqual({
      email: 'emailInvalid',
      password: 'passwordInvalid',
    })
  })

  it('reports only the invalid field and clears errors for valid credentials', async () => {
    expect(await validate('ada@reactloom.dev', 'short')).toEqual({
      email: null,
      password: 'passwordInvalid',
    })
    expect(await validate('ada@reactloom.dev', 'loom-demo')).toEqual({
      email: null,
      password: null,
    })
  })

  it('has visible feedback strings in both supported languages', () => {
    for (const locale of ['en', 'es']) {
      expect(i18n.getResource(locale, 'translation', 'emailInvalid')).toBeTruthy()
      expect(i18n.getResource(locale, 'translation', 'passwordInvalid')).toBeTruthy()
    }
  })
})
