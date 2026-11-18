import { Router } from 'express';
import { getSkillAnalytics, getSkillHistory } from '../controllers/skillController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.get('/analytics', getSkillAnalytics);
router.get('/history', getSkillHistory);

export default router;
