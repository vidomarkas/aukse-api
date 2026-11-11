import { processDueRecurring } from "../services/recurring"

const HOUR = 60 * 60 * 1000

async function run() {
  try {
    const { rules, created } = await processDueRecurring()
    if (created > 0) console.log(`[recurring] added ${created} payment(s) from ${rules} recurring rule(s)`)
  } catch (err) {
    console.error("[recurring] failed to add due payments:", err)
  }
}

/**
 * Adds due recurring payments shortly after start-up and then every hour. Hourly is plenty:
 * payments are due per day, and a missed run is caught up on the next one.
 */
export function startRecurringScheduler() {
  setTimeout(run, 10_000)
  setInterval(run, HOUR).unref()
}
