import { Request, Response } from "express"
import * as householdService from "../services/households"

export async function create(req: Request, res: Response) {
  const userId = req.user!.id
  try {
    const household = await householdService.createHousehold(userId, req.body)
    res.status(201).json({ data: household })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.id
  const households = await householdService.getHouseholdsForUser(userId)
  res.json({ data: households })
}

export async function getOne(req: Request, res: Response) {
    const { id } = req.params as { id: string }
  const household = await householdService.getHouseholdById(id)
  if (!household) {
    res.status(404).json({ error: "Household not found" })
    return
  }
  res.json(household)
}

export async function update(req: Request, res: Response) {
    const { id } = req.params as { id: string }
  const household = await householdService.updateHousehold(id, req.body)
  res.json(household)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await householdService.deleteHousehold(id)
  res.status(204).send()
}

export async function getMembers(req: Request, res: Response) {
  const { id: householdId } = req.params as { id: string }
  const members = await householdService.getMembers(householdId)
  res.json({ data: members })
}

export async function removeMember(req: Request, res: Response) {
  const { id: householdId, userId: targetUserId } = req.params as { id: string; userId: string }
  const requestingUserId = req.user!.id
  try {
    await householdService.removeMember(householdId, targetUserId, requestingUserId)
    res.status(204).send()
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}