import { Request, Response } from "express"
import * as categoryService from "../services/categories"

export async function create(req: Request, res: Response) {
  const category = await categoryService.createCategory(req.body)
  res.status(201).json(category)
}

export async function getAll(req: Request, res: Response) {
  const { householdId } = req.query as { householdId: string }
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" })
    return
  }
  const categories = await categoryService.getCategoriesForHousehold(householdId)
  res.json(categories)
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const category = await categoryService.getCategoryById(id)
  if (!category) {
    res.status(404).json({ error: "Category not found" })
    return
  }
  res.json(category)
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const category = await categoryService.updateCategory(id, req.body)
  res.json(category)
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  await categoryService.deleteCategory(id)
  res.status(204).send()
}