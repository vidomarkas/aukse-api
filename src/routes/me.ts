import { Router } from "express"
import * as meController from "../controllers/me"
import { requireAuth, requireSession } from "../middleware/auth"

const router = Router()

router.get("/export", requireAuth, meController.exportData)
router.get("/deletion-preview", requireAuth, meController.deletionPreview)
// requireSession, not requireAuth: it must still work for a retry after the data is already gone.
router.delete("/", requireSession, meController.deleteAccount)

export default router
