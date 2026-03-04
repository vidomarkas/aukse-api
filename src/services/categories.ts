import { prisma } from "../lib/prisma"
import { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category"

export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: input,
  })
}

export async function getCategoriesForHousehold(householdId: string) {
  return prisma.category.findMany({
    where: {
      OR: [
        { householdId },        // household custom categories
        { householdId: null },  // system default categories
      ],
    },
    orderBy: [{ householdId: "asc" }, { name: "asc" }],
  })
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  })
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data: input,
  })
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  })
}