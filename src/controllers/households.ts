import { Request, Response } from "express"
import * as householdService from "../services/households"

export async function create(req: Request, res: Response) {
  const userId = req.user!.id
  const household = await householdService.createHousehold(userId, req.body)
  res.status(201).json(household)
}

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.id
  const households = await householdService.getHouseholdsForUser(userId)
  res.json(households)
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