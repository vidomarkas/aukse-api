import { z } from "zod"

export const createTransactionSchema = z.object({
  householdId: z.string().uuid(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  amountBase: z.number().positive().optional(),
  exchangeRate: z.number().positive().optional(),
  type: z.enum(["expense", "income", "transfer"]).default("expense"),
  description: z.string().max(255).optional(),
  date: z.string().date(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const listTransactionsSchema = z.object({
  householdId: z.string().uuid(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>