import { z } from "zod"

export const createCategorySchema = z.object({
  householdId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().optional(),
  isIncome: z.boolean().default(false),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>