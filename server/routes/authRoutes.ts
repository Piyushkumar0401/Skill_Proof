import { Router } from 'express';
import {
  getMe,
  login,
  loginSchema,
  register,
  registerSchema,
  updatePassword,
  updatePasswordSchema,
  updateProfile,
  updateProfileSchema,
} from '../controllers/authController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, validateBody(updatePasswordSchema), updatePassword);

export default router;
