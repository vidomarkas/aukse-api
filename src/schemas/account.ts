import { z } from "zod"

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["bank", "cash", "credit_card", "savings"]),
  currency: z.string().length(3),
  balance: z.number().default(0),
  isDefault: z.boolean().default(false),
  householdId: z.string().uuid().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>