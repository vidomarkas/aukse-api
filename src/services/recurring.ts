import type { RecurringTransaction } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { firstOnOrAfter, monthlyEquivalent, nextAfter, occurrencesBetween, toDateOnly, type RecurrenceRule } from "../lib/recurrence"
import type { CreateRecurringInput, UpdateRecurringInput } from "../schemas/recurring"

const include = {
  category: { select: { id: true, name: true, icon: true, color: true } },
  user: { select: { id: true, name: true, email: true } },
}

/** Guards against a bug or a very old rule creating thousands of transactions in one go. */
const MAX_CATCH_UP = 400

export class RecurringConflictError extends Error {}

function ruleOf(r: Pick<RecurringTransaction, "frequency" | "interval" | "startDate" | "endDate">): RecurrenceRule {
  return { frequency: r.frequency, interval: r.interval, startDate: r.startDate, endDate: r.endDate }
}

function today() {
  return toDateOnly(new Date())
}

/** The next payment from today on (or from the start, if it starts later). */
function nextFromToday(rule: RecurrenceRule) {
  const start = toDateOnly(rule.startDate)
  return firstOnOrAfter(rule, start > today() ? start : today())
}

export async function listRecurring(householdId: string) {
  const items = await prisma.recurringTransaction.findMany({
    where: { householdId },
    include,
    orderBy: [{ isActive: "desc" }, { nextDueDate: "asc" }],
  })
  return items.map((r) => ({
    ...r,
    amount: Number(r.amount),
    monthlyAmount: Math.round(monthlyEquivalent(Number(r.amount), r.frequency, r.interval) * 100) / 100,
    /** Waiting for the user to confirm (autoAdd off and the date has come). */
    isDue: r.isActive && !r.autoAdd && toDateOnly(r.nextDueDate) <= today(),
    hasEnded: !r.isActive && !!r.endDate && toDateOnly(r.endDate) < today(),
  }))
}

export async function getRecurring(id: string) {
  return prisma.recurringTransaction.findUnique({ where: { id }, include })
}

export async function createRecurring(userId: string, input: CreateRecurringInput) {
  const { fromTransactionId, ...data } = input
  const rule: RecurrenceRule = {
    frequency: data.frequency,
    interval: data.interval,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
  }
  // From an existing transaction, that transaction is the first payment, so the next one is a period later.
  // Otherwise start from today: past dates are never back-filled.
  const next = fromTransactionId ? nextAfter(rule, rule.startDate) : nextFromToday(rule)
  if (!next) throw new RecurringConflictError("The end date is before the next payment, so this would never repeat.")

  return prisma.$transaction(async (tx) => {
    const recurring = await tx.recurringTransaction.create({
      data: {
        ...data,
        userId,
        categoryId: data.categoryId ?? null,
        startDate: rule.startDate,
        endDate: rule.endDate,
        nextDueDate: next,
      },
      include,
    })
    if (fromTransactionId) {
      await tx.transaction.updateMany({
        where: { id: fromTransactionId, householdId: data.householdId, recurringId: null },
        data: { recurringId: recurring.id },
      })
    }
    return recurring
  })
}

export async function updateRecurring(existing: RecurringTransaction, input: UpdateRecurringInput) {
  const { isActive, startDate, endDate, ...rest } = input
  const rule: RecurrenceRule = {
    frequency: input.frequency ?? existing.frequency,
    interval: input.interval ?? existing.interval,
    startDate: startDate ? new Date(startDate) : existing.startDate,
    endDate: endDate === undefined ? existing.endDate : endDate ? new Date(endDate) : null,
  }
  const scheduleChanged =
    input.frequency !== undefined || input.interval !== undefined || startDate !== undefined || endDate !== undefined
  const resuming = isActive === true && !existing.isActive

  // A changed schedule or a resume continues from today, so nothing missed while paused is added.
  let nextDueDate = existing.nextDueDate
  let active = isActive ?? existing.isActive
  if (scheduleChanged || resuming) {
    const next = nextFromToday(rule)
    if (next) nextDueDate = next
    else active = false // ended
  }

  return prisma.recurringTransaction.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      startDate: rule.startDate,
      endDate: rule.endDate,
      nextDueDate,
      isActive: active,
    },
    include,
  })
}

export async function deleteRecurring(id: string) {
  // Transactions it already created stay; their link is cleared.
  return prisma.$transaction([
    prisma.transaction.updateMany({ where: { recurringId: id }, data: { recurringId: null } }),
    prisma.recurringTransaction.delete({ where: { id } }),
  ])
}

/**
 * Moves the rule on from `due` to its next date, creating the transaction for `due` unless skipping.
 * The update only applies while `nextDueDate` is still `due`, so two runs can't create it twice.
 */
async function advance(r: RecurringTransaction, due: Date, create: { amount: number } | null) {
  const next = nextAfter(ruleOf(r), due)
  return prisma.$transaction(async (tx) => {
    const moved = await tx.recurringTransaction.updateMany({
      where: { id: r.id, nextDueDate: due, isActive: true },
      data: next ? { nextDueDate: next } : { isActive: false },
    })
    if (moved.count === 0) return null
    if (!create) return { created: null, next }
    const created = await tx.transaction.create({
      data: {
        householdId: r.householdId,
        userId: r.userId,
        accountId: r.accountId,
        categoryId: r.categoryId,
        recurringId: r.id,
        amount: create.amount,
        currency: r.currency,
        type: r.type,
        description: r.description,
        date: due,
      },
    })
    return { created, next }
  })
}

/** Confirm a due payment (autoAdd off): adds it with the real amount and moves on to the next date. */
export async function confirmRecurring(r: RecurringTransaction, amount?: number) {
  const due = toDateOnly(r.nextDueDate)
  if (!r.isActive || due > today()) throw new RecurringConflictError("This payment isn't due yet.")
  const result = await advance(r, due, { amount: amount ?? Number(r.amount) })
  if (!result) throw new RecurringConflictError("This payment was already handled.")
  return result
}

/** Skip this time: moves on to the next date without adding anything. */
export async function skipRecurring(r: RecurringTransaction) {
  const due = toDateOnly(r.nextDueDate)
  if (!r.isActive || due > today()) throw new RecurringConflictError("This payment isn't due yet.")
  const result = await advance(r, due, null)
  if (!result) throw new RecurringConflictError("This payment was already handled.")
  return result
}

/**
 * Adds every due payment that has "add automatically" on, catching up on any days the server missed.
 * Safe to run often and from more than one process.
 */
export async function processDueRecurring(asOf = today()) {
  const due = await prisma.recurringTransaction.findMany({
    where: { isActive: true, autoAdd: true, nextDueDate: { lte: asOf } },
  })
  let created = 0
  for (const r of due) {
    let current: RecurringTransaction | null = r
    for (let i = 0; current && i < MAX_CATCH_UP; i++) {
      const dueDate = toDateOnly(current.nextDueDate)
      if (dueDate > asOf) break
      const result = await advance(current, dueDate, { amount: Number(current.amount) })
      if (!result) break // another run handled it
      created++
      current = result.next ? { ...current, nextDueDate: result.next } : null
    }
  }
  return { rules: due.length, created }
}

/** Payments due in the next `days` days, plus confirmations still waiting from earlier. */
export async function upcomingRecurring(householdId: string, days: number) {
  const from = today()
  const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
  const items = await prisma.recurringTransaction.findMany({ where: { householdId, isActive: true }, include })

  const result = items.flatMap((r) => {
    const rule = ruleOf(r)
    const next = toDateOnly(r.nextDueDate)
    // A past date only appears when it's waiting for confirmation (auto-added ones are already done).
    const dates = next < from ? [next, ...occurrencesBetween(rule, nextAfter(rule, next) ?? to, to)] : occurrencesBetween(rule, next, to)
    return dates.map((date) => ({
      recurringId: r.id,
      description: r.description,
      amount: Number(r.amount),
      currency: r.currency,
      type: r.type,
      autoAdd: r.autoAdd,
      category: r.category,
      date: date.toISOString().slice(0, 10),
      status: date.getTime() === next.getTime() && next <= from && !r.autoAdd ? ("due" as const) : ("upcoming" as const),
    }))
  })
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
