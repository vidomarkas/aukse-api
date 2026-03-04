import { Request, Response } from "express"
import * as accountService from "../services/accounts"

export async function create(req: Request, res: Response) {
  const userId = req.user!.id
  const account = await accountService.createAccount(userId, req.body)
  res.status(201).json(account)
}

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.id
  const accounts = await accountService.getAccountsForUser(userId)
  res.json(accounts)
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const account = await accountService.getAccountById(id)
  if (!account) {
    res.status(404).json({ error: "Account not found" })
    return
  }
  res.json(account)
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const account = await accountService.updateAccount(id, req.body)
  res.json(account)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await accountService.deleteAccount(id)
  res.status(204).send()
}