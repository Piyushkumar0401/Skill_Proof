import { Router } from 'express';
import {
  analyzeAttempt,
  analyzeAttemptSchema,
  chatAssistant,
  chatSchema,
  generateRoadmap,
  roadmapSchema,
} from '../controllers/aiController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.post('/analyze', validateBody(analyzeAttemptSchema), analyzeAttempt);
router.post('/roadmap', validateBody(roadmapSchema), generateRoadmap);
router.post('/chat', validateBody(chatSchema), chatAssistant);

export default router;
