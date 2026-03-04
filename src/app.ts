import express from "express"
import cors from "cors"
import helmet from "helmet"
import { clerkMiddleware } from "@clerk/express"
import { errorHandler } from "./middleware/errorHandler"
import routes from "./routes"
import webhookRoutes from "./routes/webhooks"

const app = express()

app.use(helmet())
app.use(cors())
app.use("/api/v1/webhooks", webhookRoutes)
app.use(express.json())
app.use(clerkMiddleware())

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api/v1", routes)
app.use(errorHandler)

export default app