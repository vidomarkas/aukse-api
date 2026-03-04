import { z } from "zod"

export const createBudgetSchema = z.object({
  householdId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  period: z.enum(["monthly", "yearly"]),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
})

export const updateBudgetSchema = createBudgetSchema.partial()

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>