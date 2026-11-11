import { z } from "zod"

export const createCategorySchema = z.object({
  householdId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().optional(),
  isIncome: z.boolean().default(false),
})

// No defaults on update: renaming an income category must not turn it into an expense category.
export const updateCategorySchema = createCategorySchema.extend({ isIncome: z.boolean() }).partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>