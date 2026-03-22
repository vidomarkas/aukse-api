import { z } from "zod"

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
})

export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
})

export const InviteSchema = z.object({
  email: z.string().email().optional(),
})

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>