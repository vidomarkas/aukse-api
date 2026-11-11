import { Request, Response } from "express"
import * as analyticsService from "../services/analytics"

/**
 * Reads `householdId` and the optional `month` (YYYY-MM) from the query and checks that the
 * signed-in user belongs to the household. Sends the error response itself and returns null on failure.
 */
async function readQuery(req: Request, res: Response) {
  const { householdId, month } = req.query as { householdId?: string; month?: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return null
  }
  const range = analyticsService.monthRange(month)
  if (!range) {
    res.status(400).json({ error: "month must be in YYYY-MM format" })
    return null
  }
  if (!(await analyticsService.isHouseholdMember(req.user!.id, householdId))) {
    res.status(403).json({ error: "Not a member of this household" })
    return null
  }
  return { householdId, range }
}

export async function monthlyOverview(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  const months = Number(req.query.months ?? 6)
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    res.status(400).json({ error: "months must be between 1 and 24" })
    return
  }
  res.json(await analyticsService.getMonthlyOverview(query.householdId, query.range, months))
}

export async function spendingByCategory(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  res.json(await analyticsService.getSpendingByCategory(query.householdId, query.range))
}

export async function currentMonthStats(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  res.json(await analyticsService.getCurrentMonthStats(query.householdId, query.range))
}

export async function categoryChanges(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  res.json(await analyticsService.getCategoryChanges(query.householdId, query.range))
}

export async function attention(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  res.json(await analyticsService.getAttention(query.householdId, query.range))
}

export async function spendingTimeline(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  res.json(await analyticsService.getSpendingTimeline(query.householdId, query.range))
}

export async function categoryHistory(req: Request, res: Response) {
  const query = await readQuery(req, res)
  if (!query) return
  const { categoryId } = req.query as { categoryId?: string }
  if (!categoryId) {
    res.status(400).json({ error: "categoryId is required" })
    return
  }
  const history = await analyticsService.getCategoryHistory(query.householdId, categoryId)
  if (!history) {
    res.status(404).json({ error: "Category not found" })
    return
  }
  res.json(history)
}
