import { Request, Response } from "express"
import * as analyticsService from "../services/analytics"

export async function monthlyOverview(req: Request, res: Response) {
  const { householdId, months } = req.query as { householdId: string; months?: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const data = await analyticsService.getMonthlyOverview(householdId, months ? parseInt(months) : 6)
  res.json(data)
}

export async function spendingByCategory(req: Request, res: Response) {
  const { householdId } = req.query as { householdId: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const data = await analyticsService.getSpendingByCategory(householdId)
  res.json(data)
}

export async function currentMonthStats(req: Request, res: Response) {
  const { householdId } = req.query as { householdId: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const data = await analyticsService.getCurrentMonthStats(householdId)
  res.json(data)
}