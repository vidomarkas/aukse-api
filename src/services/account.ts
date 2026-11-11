import { prisma } from "../lib/prisma"
import { purgeHousehold } from "./households"

/** How a deleted user appears in households they shared, e.g. on transactions they logged. */
export const FORMER_MEMBER = "Former member"

async function membershipsOf(userId: string) {
  return prisma.householdMember.findMany({
    where: { userId },
    include: {
      household: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
        },
      },
    },
  })
}

/** Who takes over a shared household: an existing admin, otherwise the longest-standing member. */
function heirOf(members: { userId: string; role: string }[], leavingUserId: string) {
  const others = members.filter((m) => m.userId !== leavingUserId)
  return others.find((m) => m.role === "owner") ?? others[0] ?? null
}

/** What deleting the account would do, shown to the user before they confirm. */
export async function getDeletionPreview(userId: string) {
  const memberships = await membershipsOf(userId)
  const deleted: { id: string; name: string }[] = []
  const kept: { id: string; name: string; newAdmin: string | null; yourTransactions: number }[] = []

  for (const m of memberships) {
    const heir = heirOf(m.household.members, userId)
    if (!heir) {
      deleted.push({ id: m.household.id, name: m.household.name })
      continue
    }
    const heirMember = m.household.members.find((x) => x.userId === heir.userId)!
    kept.push({
      id: m.household.id,
      name: m.household.name,
      // Only changes hands if the leaving user was the admin and nobody else is.
      newAdmin: m.role === "owner" && heir.role !== "owner" ? heirMember.user.name ?? heirMember.user.email : null,
      yourTransactions: await prisma.transaction.count({ where: { householdId: m.household.id, userId, deletedAt: null } }),
    })
  }
  return { deleted, kept }
}

/**
 * Removes or anonymises everything about the user in Aukse. Safe to run more than once.
 * - Households where they're the only member are deleted completely.
 * - Shared households stay for the other members. An admin is kept or appointed, the household's
 *   recurring payments the user set up pass to that admin, and the user's transactions stay as
 *   household history, shown as "Former member".
 * - Their own accounts, invitations and notifications are deleted.
 * - The user row is kept only as an anonymous placeholder (no name, email or avatar), because shared
 *   transactions still point at it.
 */
export async function deleteAccountData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { deletedHouseholds: 0, leftHouseholds: 0 }
  const memberships = await membershipsOf(userId)

  let deletedHouseholds = 0
  let leftHouseholds = 0
  await prisma.$transaction(
    async (tx) => {
      for (const m of memberships) {
        const householdId = m.household.id
        const heir = heirOf(m.household.members, userId)
        if (!heir) {
          await purgeHousehold(tx, householdId)
          deletedHouseholds++
          continue
        }
        if (heir.role !== "owner") {
          await tx.householdMember.update({ where: { householdId_userId: { householdId, userId: heir.userId } }, data: { role: "owner" } })
        }
        if (m.household.createdBy === userId) {
          await tx.household.update({ where: { id: householdId }, data: { createdBy: heir.userId } })
        }
        await tx.recurringTransaction.updateMany({ where: { householdId, userId }, data: { userId: heir.userId } })
        await tx.householdMember.delete({ where: { id: m.id } })
        leftHouseholds++
      }

      // Their personal accounts: unlink transactions that used them, then delete.
      await tx.transaction.updateMany({ where: { account: { userId } }, data: { accountId: null } })
      await tx.account.deleteMany({ where: { userId } })
      await tx.invitation.deleteMany({ where: { invitedBy: userId } })
      await tx.notification.deleteMany({ where: { userId } })
      // Households they created but had already left keep pointing at the anonymous row; that's fine.

      await tx.user.update({
        where: { id: userId },
        data: {
          name: FORMER_MEMBER,
          email: `deleted-${userId}@deleted.invalid`,
          avatarUrl: null,
          deletedAt: user.deletedAt ?? new Date(),
        },
      })
    },
    { timeout: 60_000 },
  )
  return { deletedHouseholds, leftHouseholds }
}
