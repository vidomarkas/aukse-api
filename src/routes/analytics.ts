import { Router } from "express"
import * as analyticsController from "../controllers/analytics"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/monthly-overview", requireAuth, analyticsController.monthlyOverview)
router.get("/spending-by-category", requireAuth, analyticsController.spendingByCategory)
router.get("/current-month-stats", requireAuth, analyticsController.currentMonthStats)
router.get("/category-changes", requireAuth, analyticsController.categoryChanges)
router.get("/attention", requireAuth, analyticsController.attention)
router.get("/spending-timeline", requireAuth, analyticsController.spendingTimeline)
router.get("/category-history", requireAuth, analyticsController.categoryHistory)

export default router