import { Router } from 'express';
import {
  getAssessmentById,
  getAssessmentHistory,
  getAttemptById,
  listAssessments,
  startAssessment,
  submitAssessment,
  submitAssessmentSchema,
  supplementAssessment,
} from '../controllers/assessmentController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.get('/', listAssessments);
router.get('/history', getAssessmentHistory);
router.get('/attempts/:attemptId', getAttemptById);
router.get('/:id', getAssessmentById);
router.post('/:id/start', startAssessment);
router.post('/:id/submit', validateBody(submitAssessmentSchema), submitAssessment);
router.post('/:id/supplement', supplementAssessment);

export default router;
