import { Router } from "express"
import * as categoriesController from "../controllers/categories"
import { validate } from "../middleware/validate"
import { createCategorySchema, updateCategorySchema } from "../schemas/category"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/", requireAuth, categoriesController.getAll)
router.post("/", requireAuth, validate(createCategorySchema), categoriesController.create)
router.get("/:id", requireAuth, categoriesController.getOne)
router.patch("/:id", requireAuth, validate(updateCategorySchema), categoriesController.update)
router.delete("/:id", requireAuth, categoriesController.remove)

export default router