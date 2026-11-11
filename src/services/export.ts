import { strToU8, zipSync, type Zippable } from "fflate"
import { prisma } from "../lib/prisma"
import { toCsv } from "../lib/csv"

const README = `Aukse data export
=================

This archive holds everything Aukse stores about you and the households you belong to.

data.json            Everything below in one machine-readable file.
profile.json         Your profile.
<household>/         One folder per household:
  transactions.csv     Every transaction (amounts are positive; see "type").
  categories.csv       Categories used in the household.
  budgets.csv          Budgets.
  recurring.csv        Recurring payments.
  members.csv          Who is in the household.

CSV files are UTF-8 and open in Excel, Numbers and Google Sheets.
Dates are YYYY-MM-DD. Amounts use a dot as the decimal separator.
Text that starts with = + - or @ is prefixed with ' so spreadsheets don't treat it as a formula.
`

/** A folder name for the household that's safe on every OS and unique within the export. */
function folderName(name: string, id: string) {
  const safe = name.normalize("NFKD").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "household"
  return `${safe}-${id.slice(0, 8)}`
}

/** Everything about the user and their households, as a ZIP of CSV files plus a complete JSON file. */
export async function buildExport(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, defaultCurrency: true, createdAt: true },
  })
  const memberships = await prisma.householdMember.findMany({ where: { userId }, select: { householdId: true, role: true } })

  const files: Zippable = {}
  const households = []

  for (const { householdId, role } of memberships) {
    const [household, transactions, budgets, recurring] = await Promise.all([
      prisma.household.findUniqueOrThrow({
        where: { id: householdId },
        include: { members: { include: { user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "asc" } } },
      }),
      prisma.transaction.findMany({
        where: { householdId, deletedAt: null },
        include: {
          category: { select: { name: true } },
          account: { select: { name: true } },
          user: { select: { name: true, email: true } },
          tags: { include: { tag: { select: { name: true } } } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.budget.findMany({ where: { householdId }, include: { category: { select: { name: true } } }, orderBy: { startDate: "desc" } }),
      prisma.recurringTransaction.findMany({ where: { householdId }, include: { category: { select: { name: true } } }, orderBy: { nextDueDate: "asc" } }),
    ])
    // The household's own categories plus the shared defaults it actually uses.
    const usedIds = [...new Set(transactions.map((t) => t.categoryId).filter(Boolean))] as string[]
    const categories = await prisma.category.findMany({
      where: { OR: [{ householdId }, { id: { in: usedIds } }] },
      orderBy: { name: "asc" },
    })

    const who = (u: { name: string | null; email: string }) => u.name ?? u.email
    const folder = folderName(household.name, household.id)

    files[`${folder}/transactions.csv`] = strToU8(
      toCsv(
        ["date", "description", "amount", "currency", "type", "category", "account", "added_by", "notes", "tags", "recurring", "id"],
        transactions.map((t) => [
          t.date, t.description, Number(t.amount).toFixed(2), t.currency, t.type, t.category?.name, t.account?.name,
          who(t.user), t.notes, t.tags.map((x) => x.tag.name).join("; "), t.recurringId ? "yes" : "", t.id,
        ]),
      ),
    )
    files[`${folder}/categories.csv`] = strToU8(
      toCsv(["name", "kind", "icon", "color", "scope"], categories.map((c) => [c.name, c.isIncome ? "income" : "expense", c.icon, c.color, c.householdId ? "household" : "default"])),
    )
    files[`${folder}/budgets.csv`] = strToU8(
      toCsv(["category", "amount", "currency", "period", "start_date", "end_date"], budgets.map((b) => [b.category?.name ?? "Monthly total", Number(b.amount).toFixed(2), b.currency, b.period, b.startDate, b.endDate])),
    )
    files[`${folder}/recurring.csv`] = strToU8(
      toCsv(
        ["description", "amount", "currency", "type", "category", "frequency", "every", "start_date", "end_date", "next_due", "active", "added"],
        recurring.map((r) => [
          r.description, Number(r.amount).toFixed(2), r.currency, r.type, r.category?.name, r.frequency, r.interval,
          r.startDate, r.endDate, r.nextDueDate, r.isActive, r.autoAdd ? "automatically" : "after confirming",
        ]),
      ),
    )
    files[`${folder}/members.csv`] = strToU8(
      toCsv(["name", "email", "role", "joined"], household.members.map((m) => [m.user.name, m.user.email, m.role === "owner" ? "admin" : "member", m.joinedAt])),
    )

    households.push({
      id: household.id,
      name: household.name,
      yourRole: role === "owner" ? "admin" : "member",
      members: household.members.map((m) => ({ name: m.user.name, email: m.user.email, role: m.role, joinedAt: m.joinedAt })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, isIncome: c.isIncome, icon: c.icon, color: c.color, householdId: c.householdId })),
      transactions: transactions.map((t) => ({
        id: t.id, date: t.date.toISOString().slice(0, 10), description: t.description, amount: Number(t.amount), currency: t.currency,
        type: t.type, category: t.category?.name ?? null, account: t.account?.name ?? null, addedBy: who(t.user), notes: t.notes,
        tags: t.tags.map((x) => x.tag.name), recurringId: t.recurringId, createdAt: t.createdAt,
      })),
      budgets: budgets.map((b) => ({ category: b.category?.name ?? null, amount: Number(b.amount), currency: b.currency, period: b.period, startDate: b.startDate, endDate: b.endDate })),
      recurring: recurring.map((r) => ({
        id: r.id, description: r.description, amount: Number(r.amount), currency: r.currency, type: r.type, category: r.category?.name ?? null,
        frequency: r.frequency, interval: r.interval, startDate: r.startDate, endDate: r.endDate, nextDueDate: r.nextDueDate,
        isActive: r.isActive, autoAdd: r.autoAdd,
      })),
    })
  }

  const exportedAt = new Date()
  files["README.txt"] = strToU8(README)
  files["profile.json"] = strToU8(JSON.stringify(user, null, 2))
  files["data.json"] = strToU8(JSON.stringify({ exportedAt, format: "aukse-export/1", profile: user, households }, null, 2))

  return {
    filename: `aukse-export-${exportedAt.toISOString().slice(0, 10)}.zip`,
    zip: zipSync(files, { level: 6, mtime: exportedAt }),
  }
}
