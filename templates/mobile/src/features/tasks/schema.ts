import * as z from 'zod'

export const taskTitleSchema = z.string().trim().min(3).max(80)

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: z.enum(['open', 'done']),
})

export const taskListSchema = z.object({ tasks: z.array(taskSchema) })

export type Task = z.infer<typeof taskSchema>
