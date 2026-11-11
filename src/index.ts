import "dotenv/config"
import app from "./app"
import { startRecurringScheduler } from "./jobs/recurring"

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`aukse-api running on http://localhost:${PORT}`)
  startRecurringScheduler()
})