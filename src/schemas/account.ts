import { z } from "zod"

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["bank", "cash", "credit_card", "savings"]),
  currency: z.string().length(3),
  balance: z.number().default(0),
  isDefault: z.boolean().default(false),
  householdId: z.string().uuid().optional(),
})

// No defaults on update: a partial update must not reset the balance to 0 or clear isDefault.
export const updateAccountSchema = createAccountSchema
  .extend({ balance: z.number(), isDefault: z.boolean() })
  .partial()

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>