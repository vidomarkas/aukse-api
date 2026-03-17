import { Router } from "express"
import transactionRoutes from "./transactions"
import householdRoutes from "./households"
import accountRoutes from "./accounts"
import categoryRoutes from "./categories"
import budgetRoutes from "./budgets"
import webhookRoutes from "./webhooks"
import analyticsRoutes from "./analytics"




const router = Router()

router.use("/webhooks", webhookRoutes)
router.use("/transactions", transactionRoutes)
router.use("/households", householdRoutes)
router.use("/accounts", accountRoutes)
router.use("/categories", categoryRoutes)
router.use("/budgets", budgetRoutes)
router.use("/analytics", analyticsRoutes)





export default router