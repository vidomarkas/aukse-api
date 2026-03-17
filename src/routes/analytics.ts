import { Router } from "express"
import * as analyticsController from "../controllers/analytics"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/monthly-overview", requireAuth, analyticsController.monthlyOverview)
router.get("/spending-by-category", requireAuth, analyticsController.spendingByCategory)
router.get("/current-month-stats", requireAuth, analyticsController.currentMonthStats)

export default router