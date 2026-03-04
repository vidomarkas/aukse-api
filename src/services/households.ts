import { prisma } from "../lib/prisma"
import { CreateHouseholdInput, UpdateHouseholdInput } from "../schemas/household"

export async function createHousehold(userId: string, input: CreateHouseholdInput) {
  return prisma.household.create({
    data: {
      name: input.name,
      createdBy: userId,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
    include: { members: true },
  })
}

export async function getHouseholdById(id: string) {
  return prisma.household.findUnique({
    where: { id },
    include: { members: { include: { user: true } } },
  })
}

export async function getHouseholdsForUser(userId: string) {
  return prisma.household.findMany({
    where: {
      members: { some: { userId } },
    },
    include: { members: true },
  })
}

export async function updateHousehold(id: string, input: UpdateHouseholdInput) {
  return prisma.household.update({
    where: { id },
    data: input,
  })
}

export async function deleteHousehold(id: string) {
  return prisma.household.delete({
    where: { id },
  })
}