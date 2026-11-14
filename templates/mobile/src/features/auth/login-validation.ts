type LoginFieldErrors = { email?: unknown; password?: unknown }

export function loginValidationErrorKeys(errors: LoginFieldErrors) {
  return {
    email: errors.email ? 'emailInvalid' : null,
    password: errors.password ? 'passwordInvalid' : null,
  }
}
