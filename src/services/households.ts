import { prisma } from "../lib/prisma"
import { CreateHouseholdInput, UpdateHouseholdInput } from "../schemas/household"

const HOUSEHOLD_LIMIT = 5

export async function createHousehold(userId: string, input: CreateHouseholdInput) {
  const count = await prisma.householdMember.count({ where: { userId } })
  if (count >= HOUSEHOLD_LIMIT) throw new Error("Household limit reached")

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

export async function getMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { joinedAt: "asc" },
  })
}

export async function removeMember(
  householdId: string,
  targetUserId: string,
  requestingUserId: string,
) {
  const requester = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: requestingUserId } },
  })
  if (!requester) throw new Error("Not a member of this household")

  // Only owner can remove others; members can only remove themselves
  if (targetUserId !== requestingUserId && requester.role !== "owner") {
    throw new Error("Only the owner can remove other members")
  }

  // Owner cannot leave their own household
  if (targetUserId === requestingUserId && requester.role === "owner") {
    throw new Error("Owner cannot leave the household. Transfer ownership or delete the household.")
  }

  return prisma.householdMember.delete({
    where: { householdId_userId: { householdId, userId: targetUserId } },
  })
}