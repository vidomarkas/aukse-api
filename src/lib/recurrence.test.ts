import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { firstOnOrAfter, monthlyEquivalent, nextAfter, occurrence, occurrencesBetween, type RecurrenceRule } from "./recurrence"

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null)

describe("occurrence", () => {
  it("keeps the day of the month, clamping to short months", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1, startDate: d("2026-01-31") }
    assert.deepEqual([0, 1, 2, 3].map((k) => iso(occurrence(rule, k))), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"])
  })

  it("handles leap years for yearly payments on 29 Feb", () => {
    const rule: RecurrenceRule = { frequency: "yearly", interval: 1, startDate: d("2024-02-29") }
    assert.deepEqual([0, 1, 4].map((k) => iso(occurrence(rule, k))), ["2024-02-29", "2025-02-28", "2028-02-29"])
  })

  it("supports intervals", () => {
    const fortnightly: RecurrenceRule = { frequency: "weekly", interval: 2, startDate: d("2026-11-02") }
    assert.equal(iso(occurrence(fortnightly, 1)), "2026-11-16")
    const quarterly: RecurrenceRule = { frequency: "monthly", interval: 3, startDate: d("2026-11-15") }
    assert.equal(iso(occurrence(quarterly, 1)), "2027-02-15")
  })

  it("crosses year boundaries", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1, startDate: d("2026-11-05") }
    assert.equal(iso(occurrence(rule, 3)), "2027-02-05")
  })
})

describe("firstOnOrAfter / nextAfter", () => {
  const rent: RecurrenceRule = { frequency: "monthly", interval: 1, startDate: d("2026-01-01") }

  it("returns the date itself when it is an occurrence", () => {
    assert.equal(iso(firstOnOrAfter(rent, d("2026-11-01"))), "2026-11-01")
  })

  it("finds the next occurrence after a date", () => {
    assert.equal(iso(firstOnOrAfter(rent, d("2026-11-11"))), "2026-12-01")
    assert.equal(iso(nextAfter(rent, d("2026-12-01"))), "2027-01-01")
  })

  it("never returns a date before the start", () => {
    const future: RecurrenceRule = { frequency: "monthly", interval: 1, startDate: d("2027-03-10") }
    assert.equal(iso(firstOnOrAfter(future, d("2026-11-11"))), "2027-03-10")
  })

  it("stops at the end date", () => {
    const ending: RecurrenceRule = { ...rent, endDate: d("2026-12-15") }
    assert.equal(iso(nextAfter(ending, d("2026-12-01"))), null)
    assert.equal(iso(firstOnOrAfter(ending, d("2026-12-01"))), "2026-12-01")
  })

  it("keeps the anchor day after a short month", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1, startDate: d("2026-01-31") }
    assert.equal(iso(nextAfter(rule, d("2026-02-28"))), "2026-03-31")
  })

  it("is fast for rules that started long ago", () => {
    const daily: RecurrenceRule = { frequency: "daily", interval: 1, startDate: d("2000-01-01") }
    assert.equal(iso(firstOnOrAfter(daily, d("2026-11-11"))), "2026-11-11")
  })
})

describe("occurrencesBetween", () => {
  it("lists every due date in a window, inclusive", () => {
    const weekly: RecurrenceRule = { frequency: "weekly", interval: 1, startDate: d("2026-11-02") }
    assert.deepEqual(occurrencesBetween(weekly, d("2026-11-09"), d("2026-11-23")).map(iso), ["2026-11-09", "2026-11-16", "2026-11-23"])
  })

  it("is empty when nothing falls in the window", () => {
    const yearly: RecurrenceRule = { frequency: "yearly", interval: 1, startDate: d("2026-06-01") }
    assert.deepEqual(occurrencesBetween(yearly, d("2026-11-01"), d("2026-11-30")), [])
  })
})

describe("monthlyEquivalent", () => {
  it("converts to a per-month amount", () => {
    assert.equal(monthlyEquivalent(120, "yearly", 1), 10)
    assert.equal(Math.round(monthlyEquivalent(10, "weekly", 1) * 100) / 100, 43.33)
    assert.equal(monthlyEquivalent(30, "monthly", 3), 10)
  })
})
