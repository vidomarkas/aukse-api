import { Request, Response } from "express"
import * as budgetService from "../services/budgets"

export async function create(req: Request, res: Response) {
  const budget = await budgetService.createBudget(req.body)
  res.status(201).json(budget)
}

export async function getAll(req: Request, res: Response) {
  const { householdId } = req.query as { householdId: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const budgets = await budgetService.getBudgetsForHousehold(householdId)
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
  const budget = await budgetService.updateBudget(id, req.body)
  res.json(budget)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await budgetService.deleteBudget(id)
  res.status(204).send()
}