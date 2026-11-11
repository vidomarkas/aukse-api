import { Request, Response } from "express"
import * as recurringService from "../services/recurring"
import { isHouseholdMember } from "../services/analytics"
import type { ConfirmRecurringInput, CreateRecurringInput, UpdateRecurringInput } from "../schemas/recurring"

/** Loads the recurring payment and checks the user belongs to its household. Sends the error itself. */
async function loadOwned(req: Request, res: Response) {
  const recurring = await recurringService.getRecurring(String(req.params.id))
  if (!recurring || !(await isHouseholdMember(req.user!.id, recurring.householdId))) {
    res.status(404).json({ error: "Recurring payment not found" })
    return null
  }
  return recurring
}

async function requireMember(req: Request, res: Response, householdId: string | undefined) {
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return false
  }
  if (!(await isHouseholdMember(req.user!.id, householdId))) {
    res.status(403).json({ error: "Not a member of this household" })
    return false
  }
  return true
}

/** Turns "can't do that now" errors into 409s; anything else goes to the error handler. */
async function handleConflicts(res: Response, action: () => Promise<void>) {
  try {
    await action()
  } catch (err) {
    if (err instanceof recurringService.RecurringConflictError) {
      res.status(409).json({ error: err.message })
      return
    }
    throw err
  }
}

export async function list(req: Request, res: Response) {
  const householdId = req.query.householdId as string | undefined
  if (!(await requireMember(req, res, householdId))) return
  res.json(await recurringService.listRecurring(householdId!))
}

export async function upcoming(req: Request, res: Response) {
  const householdId = req.query.householdId as string | undefined
  if (!(await requireMember(req, res, householdId))) return
  const days = Math.min(Math.max(Number(req.query.days ?? 14) || 14, 1), 90)
  res.json(await recurringService.upcomingRecurring(householdId!, days))
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateRecurringInput
  if (!(await requireMember(req, res, input.householdId))) return
  await handleConflicts(res, async () => {
    res.status(201).json(await recurringService.createRecurring(req.user!.id, input))
  })
}

export async function update(req: Request, res: Response) {
  const existing = await loadOwned(req, res)
  if (!existing) return
  res.json(await recurringService.updateRecurring(existing, req.body as UpdateRecurringInput))
}

export async function remove(req: Request, res: Response) {
  const existing = await loadOwned(req, res)
  if (!existing) return
  await recurringService.deleteRecurring(existing.id)
  res.status(204).send()
}

export async function confirm(req: Request, res: Response) {
  const existing = await loadOwned(req, res)
  if (!existing) return
  const { amount } = req.body as ConfirmRecurringInput
  await handleConflicts(res, async () => {
    res.json(await recurringService.confirmRecurring(existing, amount))
  })
}

export async function skip(req: Request, res: Response) {
  const existing = await loadOwned(req, res)
  if (!existing) return
  await handleConflicts(res, async () => {
    res.json(await recurringService.skipRecurring(existing))
  })
}
