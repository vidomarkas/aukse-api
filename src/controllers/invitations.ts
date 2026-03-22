import { Request, Response } from "express"
import * as invitationService from "../services/invitations"

// POST /households/:id/invitations
export async function create(req: Request, res: Response) {
  const { id: householdId } = req.params as { id: string }
  const userId = req.user!.id
  const { email } = req.body

  const invitation = await invitationService.createInvitation(householdId, userId, email)
  res.status(201).json({ data: invitation })
}

// GET /households/:id/invitations
export async function list(req: Request, res: Response) {
  const { id: householdId } = req.params as { id: string }
  const invitations = await invitationService.listInvitations(householdId)
  res.json({ data: invitations })
}

// DELETE /households/:id/invitations/:invitationId
export async function cancel(req: Request, res: Response) {
  const { id: householdId, invitationId } = req.params as { id: string; invitationId: string }
  await invitationService.cancelInvitation(invitationId, householdId)
  res.status(204).send()
}

// GET /invitations/:token
export async function getByToken(req: Request, res: Response) {
  const { token } = req.params as { token: string }
  const invitation = await invitationService.getInvitation(token)
  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" })
    return
  }
  res.json({ data: invitation })
}

// POST /invitations/:token/accept
export async function accept(req: Request, res: Response) {
  const { token } = req.params as { token: string }
  const userId = req.user!.id
  try {
    const member = await invitationService.acceptInvitation(token, userId)
    res.status(201).json({ data: member })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
