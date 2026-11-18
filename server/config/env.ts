import 'dotenv/config';

export const env = {
  port: Number(
    (process.env.NODE_ENV === 'production' ? process.env.PORT : undefined) || 3000
  ),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI?.trim() || '',
  jwtSecret:
    process.env.JWT_SECRET?.trim() ||
    'skillproof_local_dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
  corsOrigin: process.env.CORS_ORIGIN?.trim() || '',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
  appUrl: process.env.APP_URL?.trim() || 'http://localhost:3000',
};
