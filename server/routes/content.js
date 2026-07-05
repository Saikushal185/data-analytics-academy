// Serves the assembled, public content payload (no answer keys).
import { Router } from 'express'
import { publicContent } from '../content/index.js'

const router = Router()
router.get('/', (_req, res) => res.json(publicContent))
export default router
