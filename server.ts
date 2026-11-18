import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './server/config/env.ts';
import { connectDatabase, getDatabaseMode } from './server/config/db.ts';
import { ensureSeedAssessments } from './server/data/seedAssessments.ts';
import authRoutes from './server/routes/authRoutes.ts';
import assessmentRoutes from './server/routes/assessmentRoutes.ts';
import skillRoutes from './server/routes/skillRoutes.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import { errorHandler, notFoundApiHandler } from './server/middleware/errorMiddleware.ts';

async function bootstrap() {
  await connectDatabase();
  await ensureSeedAssessments();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers (preserve iframe embedding in preview environments)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  // Secure CORS configuration
  const allowedOrigins = env.corsOrigin
    ? env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  // Rate limiters
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Try again shortly.', code: 'AUTH_RATE_LIMITED' },
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request quota reached for this window. Try again shortly.', code: 'AI_RATE_LIMITED' },
  });

  app.use('/api', apiLimiter);
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: getDatabaseMode(),
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY?.trim() &&
          process.env.GEMINI_API_KEY.trim() !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/ai', aiLimiter, aiRoutes);

  app.use('/api', notFoundApiHandler);
  app.use(errorHandler);

  if (env.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[server] SkillProof running on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
