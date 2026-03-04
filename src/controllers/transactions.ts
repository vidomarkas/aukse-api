import { Request, Response } from "express"
import * as transactionService from "../services/transactions"
import { listTransactionsSchema } from "../schemas/transaction"

export async function create(req: Request, res: Response) {
  const userId = req.user!.id
  const transaction = await transactionService.createTransaction(userId, req.body)
  res.status(201).json(transaction)
}

export async function getAll(req: Request, res: Response) {
  const result = listTransactionsSchema.safeParse(req.query)
  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    })
    return
  }
  const transactions = await transactionService.listTransactions(result.data)
  res.json(transactions)
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const transaction = await transactionService.getTransactionById(id)
  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" })
    return
  }
  res.json(transaction)
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const transaction = await transactionService.updateTransaction(id, req.body)
  res.json(transaction)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await transactionService.deleteTransaction(id)
  res.status(204).send()
}