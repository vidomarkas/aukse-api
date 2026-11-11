import { Router } from "express"
import transactionRoutes from "./transactions"
import householdRoutes from "./households"
import accountRoutes from "./accounts"
import categoryRoutes from "./categories"
import budgetRoutes from "./budgets"
import webhookRoutes from "./webhooks"
import analyticsRoutes from "./analytics"
import invitationRoutes from "./invitations"
import recurringRoutes from "./recurring"
import meRoutes from "./me"




const router = Router()

router.use("/webhooks", webhookRoutes)
router.use("/transactions", transactionRoutes)
router.use("/households", householdRoutes)
router.use("/accounts", accountRoutes)
router.use("/categories", categoryRoutes)
router.use("/budgets", budgetRoutes)
router.use("/analytics", analyticsRoutes)
router.use("/invitations", invitationRoutes)
router.use("/recurring", recurringRoutes)
router.use("/me", meRoutes)





export default router