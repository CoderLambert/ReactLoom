import * as z from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  }),
})

export type Session = z.infer<typeof sessionSchema>
export type LoginInput = z.infer<typeof loginSchema>

export const demoLogin = {
  email: 'ada@reactloom.dev',
  password: 'loom-demo',
}
