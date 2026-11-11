import { z } from "zod"

const frequency = z.enum(["daily", "weekly", "monthly", "yearly"])
const type = z.enum(["expense", "income", "transfer"])

export const createRecurringSchema = z.object({
  householdId: z.string().uuid(),
  description: z.string().trim().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3),
  type: type.default("expense"),
  categoryId: z.string().uuid().nullable().optional(),
  frequency,
  interval: z.number().int().min(1).max(365).default(1),
  startDate: z.string().date(),
  endDate: z.string().date().nullable().optional(),
  autoAdd: z.boolean().default(true),
  /** "Make recurring" from an existing transaction: it counts as the first payment and gets linked. */
  fromTransactionId: z.string().uuid().optional(),
})

// Written out instead of `.partial()` so no defaults are filled in on update.
export const updateRecurringSchema = z.object({
  description: z.string().trim().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  type: type.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  frequency: frequency.optional(),
  interval: z.number().int().min(1).max(365).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().nullable().optional(),
  autoAdd: z.boolean().optional(),
  /** false pauses it; true resumes it from today. */
  isActive: z.boolean().optional(),
})

export const confirmRecurringSchema = z.object({
  /** The real amount, when it differs from the planned one (variable bills). */
  amount: z.number().positive().optional(),
})

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>
export type ConfirmRecurringInput = z.infer<typeof confirmRecurringSchema>
