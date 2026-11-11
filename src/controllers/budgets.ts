import { Request, Response } from "express"
import * as budgetService from "../services/budgets"
import type { CreateBudgetInput, UpdateBudgetInput } from "../schemas/budget"

function conflictMessage(existing: { category: { name: string } | null; period: string }) {
  const what = existing.category ? `${existing.category.name}` : "the monthly total"
  return `There's already a ${existing.period} budget for ${what}. Edit that one instead.`
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateBudgetInput
  const conflict = await budgetService.findConflictingBudget({
    householdId: input.householdId,
    categoryId: input.categoryId ?? null,
    period: input.period,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : null,
  })
  if (conflict) {
    res.status(409).json({ error: conflictMessage(conflict) })
    return
  }
  const budget = await budgetService.createBudget(input)
  res.status(201).json(budget)
}

export async function getAll(req: Request, res: Response) {
  const { householdId } = req.query as { householdId: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const budgets = await budgetService.getBudgetsWithSpending(householdId)
  res.json(budgets)
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const budget = await budgetService.getBudgetById(id)
  if (!budget) {
    res.status(404).json({ error: "Budget not found" })
    return
  }
  res.json(budget)
}

export async function getSpending(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const spending = await budgetService.getBudgetSpending(id)
  if (!spending) {
    res.status(404).json({ error: "Budget not found" })
    return
  }
  res.json(spending)
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const input = req.body as UpdateBudgetInput
  const existing = await budgetService.getBudgetById(id)
  if (!existing) {
    res.status(404).json({ error: "Budget not found" })
    return
  }
  // Check the budget as it would be after the update.
  const endDate = input.endDate ? new Date(input.endDate) : existing.endDate
  const conflict = await budgetService.findConflictingBudget({
    householdId: existing.householdId,
    categoryId: "categoryId" in input ? input.categoryId ?? null : existing.categoryId,
    period: input.period ?? existing.period,
    startDate: input.startDate ? new Date(input.startDate) : existing.startDate,
    endDate,
    excludeId: id,
  })
  if (conflict) {
    res.status(409).json({ error: conflictMessage(conflict) })
    return
  }
  const budget = await budgetService.updateBudget(id, input)
  res.json(budget)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await budgetService.deleteBudget(id)
  res.status(204).send()
}