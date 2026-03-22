import { prisma } from "../lib/prisma"

const HOUSEHOLD_LIMIT = 5
const INVITE_EXPIRY_DAYS = 7

export async function createInvitation(householdId: string, invitedBy: string, email?: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

  return prisma.invitation.create({
    data: { householdId, invitedBy, email, expiresAt },
    include: {
      household: { select: { name: true } },
      inviter: { select: { name: true, email: true } },
    },
  })
}

export async function getInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: { select: { id: true, name: true } },
      inviter: { select: { name: true, email: true } },
    },
  })
  if (!invitation) return null

  // Auto-expire
  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { token }, data: { status: "expired" } })
    return { ...invitation, status: "expired" as const }
  }

  return invitation
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } })
  if (!invitation) throw new Error("Invitation not found")
  if (invitation.status !== "pending") throw new Error("Invitation is no longer valid")
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { token }, data: { status: "expired" } })
    throw new Error("Invitation has expired")
  }

  // Check household limit
  const householdCount = await prisma.householdMember.count({ where: { userId } })
  if (householdCount >= HOUSEHOLD_LIMIT) throw new Error("Household limit reached")

  // Check if already a member
  const existing = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: invitation.householdId, userId } },
  })
  if (existing) throw new Error("Already a member of this household")

  // Accept + add member in a transaction
  const [, member] = await prisma.$transaction([
    prisma.invitation.update({ where: { token }, data: { status: "accepted" } }),
    prisma.householdMember.create({
      data: { householdId: invitation.householdId, userId, role: "member" },
    }),
  ])

  return member
}

export async function listInvitations(householdId: string) {
  return prisma.invitation.findMany({
    where: { householdId, status: "pending" },
    include: { inviter: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function cancelInvitation(invitationId: string, householdId: string) {
  return prisma.invitation.updateMany({
    where: { id: invitationId, householdId, status: "pending" },
    data: { status: "expired" },
  })
}
