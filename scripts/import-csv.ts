/**
 * One-time CSV import script for aukse-api.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/import-csv.ts \
 *     --household-id <id> \
 *     --user-id <id> \
 *     [--file ./my-export.csv]   # omit to read from stdin
 *
 * Expected CSV columns (header row required):
 *   id, user_id, amount, type, category, description, transaction_date, created_at, updated_at
 */

import * as fs from "fs"
import * as readline from "readline"
import { prisma } from "../src/lib/prisma"

// ---------------------------------------------------------------------------
// Category name mapping (CSV value → Aukse category name)
// ---------------------------------------------------------------------------
const CATEGORY_MAP: Record<string, string> = {
  "food & dining": "Food & Drink",
  transportation: "Transport",
  healthcare: "Health",
  shopping: "Shopping",
  entertainment: "Entertainment",
  "bills & utilities": "Housing",
  other: "Other",
  travel: "Travel",       // created automatically if missing
  salary: "Salary",
  refund: "Other Income", // refund = money coming back = income type
}

function mapCategory(csvCategory: string, transactionType: string): string {
  const key = csvCategory.trim().toLowerCase()
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key]
  // Unknown category — fall back based on transaction type
  return transactionType === "income" ? "Other Income" : "Other"
}

// ---------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields (including commas and "" escapes)
// ---------------------------------------------------------------------------
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0

  while (i <= line.length) {
    if (i === line.length) {
      // Trailing empty field after a comma
      fields.push("")
      break
    }

    if (line[i] === '"') {
      // Quoted field
      i++ // skip opening quote
      let value = ""
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            // Escaped double-quote
            value += '"'
            i += 2
          } else {
            // Closing quote
            i++
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value)
      // Skip comma separator (or end of line)
      if (line[i] === ",") i++
    } else {
      // Unquoted field — read until next comma
      const start = i
      while (i < line.length && line[i] !== ",") i++
      fields.push(line.slice(start, i))
      if (line[i] === ",") i++
    }
  }

  return fields
}

function parseCSV(raw: string): Array<Record<string, string>> {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "")
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0]).map((h) => h.trim())
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim()
    })
    rows.push(row)
  }

  return rows
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]): {
  householdId: string
  userId: string
  file?: string
} {
  const args = argv.slice(2)
  let householdId: string | undefined
  let userId: string | undefined
  let file: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--household-id" && args[i + 1]) {
      householdId = args[++i]
    } else if (args[i] === "--user-id" && args[i + 1]) {
      userId = args[++i]
    } else if (args[i] === "--file" && args[i + 1]) {
      file = args[++i]
    }
  }

  if (!householdId) {
    console.error("Error: --household-id is required")
    process.exit(1)
  }
  if (!userId) {
    console.error("Error: --user-id is required")
    process.exit(1)
  }

  return { householdId, userId, file }
}

// ---------------------------------------------------------------------------
// Read all of stdin as a string
// ---------------------------------------------------------------------------
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on("data", (chunk) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    process.stdin.on("error", reject)
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { householdId, userId, file } = parseArgs(process.argv)

  // Read CSV content
  let csvContent: string
  if (file) {
    if (!fs.existsSync(file)) {
      console.error(`Error: file not found: ${file}`)
      process.exit(1)
    }
    csvContent = fs.readFileSync(file, "utf8")
  } else {
    if (process.stdin.isTTY) {
      console.error("Error: no --file provided and stdin is a TTY. Pipe a CSV file or use --file.")
      process.exit(1)
    }
    csvContent = await readStdin()
  }

  const rows = parseCSV(csvContent)
  const total = rows.length

  if (total === 0) {
    console.log("No rows found in CSV. Exiting.")
    await prisma.$disconnect()
    return
  }

  console.log(`Parsed ${total} data rows from CSV.`)

  // ------------------------------------------------------------------
  // Pre-load all categories relevant to this household in one query.
  // System categories have householdId = null; household-specific ones
  // match the provided householdId.
  // ------------------------------------------------------------------
  const dbCategories = await prisma.category.findMany({
    where: {
      OR: [{ householdId: null }, { householdId }],
    },
  })

  // Build a lookup: lower-cased name → category record
  // Household-specific categories take priority over system ones.
  const categoryByName = new Map<string, (typeof dbCategories)[number]>()
  // Load system categories first, then household ones (so household wins on conflict)
  for (const cat of dbCategories) {
    if (cat.householdId === null) {
      categoryByName.set(cat.name.toLowerCase(), cat)
    }
  }
  for (const cat of dbCategories) {
    if (cat.householdId === householdId) {
      categoryByName.set(cat.name.toLowerCase(), cat)
    }
  }

  // ------------------------------------------------------------------
  // Ensure "Travel" and "Other" exist (create as global if missing)
  // ------------------------------------------------------------------
  if (!categoryByName.has("travel")) {
    console.log('Category "Travel" not found — creating it as a global category.')
    const travelCat = await prisma.category.create({
      data: {
        householdId: null,
        name: "Travel",
        icon: "✈️",
        color: "#6366f1",
        isIncome: false,
      },
    })
    categoryByName.set("travel", travelCat)
  }

  if (!categoryByName.has("other")) {
    console.log('Category "Other" not found — creating it as a global category.')
    const otherCat = await prisma.category.create({
      data: {
        householdId: null,
        name: "Other",
        icon: "📦",
        color: "#6b7280",
        isIncome: false,
      },
    })
    categoryByName.set("other", otherCat)
  }

  if (!categoryByName.has("other income")) {
    console.log('Category "Other Income" not found — creating it as a global category.')
    const otherIncomeCat = await prisma.category.create({
      data: {
        householdId: null,
        name: "Other Income",
        icon: "📥",
        color: "#84cc16",
        isIncome: true,
      },
    })
    categoryByName.set("other income", otherIncomeCat)
  }

  // ------------------------------------------------------------------
  // Import rows
  // ------------------------------------------------------------------
  let imported = 0
  let skipped = 0
  const missingCategories = new Set<string>()
  const failedRows: Array<{ rowNumber: number; csvId: string; reason: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // 1-based, +1 for header

    // Map type
    const rawType = (row["type"] ?? "").toLowerCase()
    let transactionType: "expense" | "income" | "transfer"
    if (rawType === "income") {
      transactionType = "income"
    } else if (rawType === "expense") {
      transactionType = "expense"
    } else if (rawType === "transfer") {
      transactionType = "transfer"
    } else {
      const reason = `Unknown transaction type "${row["type"]}"`
      console.warn(`  Row ${rowNumber} (id=${row["id"]}) skipped: ${reason}`)
      failedRows.push({ rowNumber, csvId: row["id"] ?? "", reason })
      skipped++
      continue
    }

    // Map category
    const aukseCategoryName = mapCategory(row["category"] ?? "", transactionType)
    const categoryRecord = categoryByName.get(aukseCategoryName.toLowerCase())

    if (!categoryRecord) {
      missingCategories.add(aukseCategoryName)
      const reason = `Category "${aukseCategoryName}" not found in DB`
      console.warn(`  Row ${rowNumber} (id=${row["id"]}) skipped: ${reason}`)
      failedRows.push({ rowNumber, csvId: row["id"] ?? "", reason })
      skipped++
      continue
    }

    // Parse amount
    const amount = parseFloat(row["amount"] ?? "")
    if (isNaN(amount)) {
      const reason = `Invalid amount "${row["amount"]}"`
      console.warn(`  Row ${rowNumber} (id=${row["id"]}) skipped: ${reason}`)
      failedRows.push({ rowNumber, csvId: row["id"] ?? "", reason })
      skipped++
      continue
    }

    // Parse date
    const rawDate = row["transaction_date"] ?? ""
    const parsedDate = new Date(rawDate)
    if (isNaN(parsedDate.getTime())) {
      const reason = `Invalid transaction_date "${rawDate}"`
      console.warn(`  Row ${rowNumber} (id=${row["id"]}) skipped: ${reason}`)
      failedRows.push({ rowNumber, csvId: row["id"] ?? "", reason })
      skipped++
      continue
    }

    // Insert transaction
    try {
      await prisma.transaction.create({
        data: {
          householdId,
          userId,
          categoryId: categoryRecord.id,
          amount,
          currency: "EUR",
          type: transactionType,
          description: row["description"] || null,
          date: parsedDate,
        },
      })

      imported++
      process.stdout.write(`\rImported ${imported}/${total} transactions`)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.warn(`\n  Row ${rowNumber} (id=${row["id"]}) failed: ${reason}`)
      failedRows.push({ rowNumber, csvId: row["id"] ?? "", reason })
      skipped++
    }
  }

  // Final newline after progress output
  console.log()

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log("\n========== Import Summary ==========")
  console.log(`Total rows in CSV : ${total}`)
  console.log(`Successfully imported: ${imported}`)
  console.log(`Skipped / errored    : ${skipped}`)

  if (missingCategories.size > 0) {
    console.log(
      `\nCategories not found in DB (${missingCategories.size}):`
    )
    for (const name of missingCategories) {
      console.log(`  - ${name}`)
    }
  }

  if (failedRows.length > 0) {
    console.log(`\nFailed rows:`)
    for (const { rowNumber, csvId, reason } of failedRows) {
      console.log(`  Row ${rowNumber} (csv id=${csvId}): ${reason}`)
    }
  }

  console.log("====================================")

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error("Fatal error:", err)
  await prisma.$disconnect()
  process.exit(1)
})
