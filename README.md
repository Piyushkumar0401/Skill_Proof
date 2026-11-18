# SkillProof — AI-Powered Developer Skill Verification Platform

SkillProof is a full-stack MERN application built to verify practical developer ability through timed technical assessments, deterministic code execution, transparent skill scoring, and evidence-grounded Gemini AI diagnostics.

## Core Features

- **JWT Authentication & Profiles**: Secure registration, login, bcrypt password hashing, protected workspace routes, and configurable developer track/theme preferences.
- **Technical Assessment Engine**: Pre-seeded MongoDB question bank spanning **10 skills** (`JavaScript`, `React`, `Node.js`, `Express.js`, `MongoDB`, `Python`, `Data Structures and Algorithms`, `DBMS`, `Computer Networks`, `Operating Systems`) across **Beginner**, **Intermediate**, and **Advanced** difficulties.
- **Sandboxed Code Execution**: JavaScript and algorithm challenges are executed in an isolated Node `node:vm` sandbox against unit test cases alongside MCQ conceptual evaluations.
- **Transparent SkillProof Score (0–100)**: Computed deterministically from verified assessment percentages, difficulty multipliers (`Beginner 0.85x`, `Intermediate 1.00x`, `Advanced 1.12x`), and chronological recency weights across 6 engineering categories.
- **Developer Dashboard & Analytics**: Recharts radar distribution, longitudinal score progression charts, strongest/weakest skill rankings, and searchable assessment history.
- **Gemini AI Evaluation, Roadmaps & Coach**: Server-side `@google/genai` integration generating structured attempt reviews, personalized 4-phase learning roadmaps, supplemental practice questions, and grounded skill coach chat.

## Project Structure

```
skillproof/
├── server.ts                  # Express + Vite full-stack entry point
├── server/
│   ├── config/                # Environment & MongoDB/Mongoose connection
│   ├── controllers/           # Auth, Assessment, Skill, AI handlers
│   ├── data/                  # Initial 10-skill assessment & question bank seed
│   ├── middleware/            # JWT auth, Zod validation, centralized errors
│   ├── models/                # Mongoose schemas (User, Assessment, Question, AssessmentAttempt, SkillHistory)
│   ├── routes/                # REST API routers (/api/auth, /api/assessments, /api/skills, /api/ai)
│   ├── services/              # Sandboxed evaluator, scoring engine, Gemini AI service
│   └── utils/                 # Typed AppError helper
├── src/
│   ├── components/            # ProtectedRoute and shared UI primitives
│   ├── context/               # AuthContext & ThemeContext (Dark/Light)
│   ├── layouts/               # DashboardLayout with sidebar & breadcrumbs
│   ├── pages/                 # All 10 pages (Landing, Auth, Dashboard, Assessments, Runner, Results, Analytics, AI Assistant, Settings)
│   ├── services/              # Axios client with Bearer token interceptor
│   ├── types/                 # Shared frontend TypeScript definitions
│   └── utils/                 # Formatting helpers
├── .env.example               # Required environment variable template
└── .gitignore
```

## Environment Configuration

Copy `.env.example` to `.env` and fill in your values (never commit `.env`):

```env
GEMINI_API_KEY="your-gemini-api-key"
MONGODB_URI="mongodb://127.0.0.1:27017/skillproof"
JWT_SECRET="replace-with-a-strong-random-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
PORT=3000
APP_URL="http://localhost:3000"
```

> **Note**: If `MONGODB_URI` is omitted in local development, SkillProof automatically launches an embedded `mongodb-memory-server` instance so the database and seeded question bank run immediately. For persistent cloud deployments, provide a MongoDB Atlas or self-hosted `MONGODB_URI`.

## Local Setup & Execution

```bash
# 1. Install dependencies
npm install

# 2. Run development server (Express API + Vite on port 3000)
npm run dev

# 3. Build frontend for production
npm run build

# 4. Start production server
npm start
```

## API Endpoints

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password`
- **Assessments**: `GET /api/assessments`, `GET /api/assessments/history`, `GET /api/assessments/attempts/:attemptId`, `GET /api/assessments/:id`, `POST /api/assessments/:id/start`, `POST /api/assessments/:id/submit`, `POST /api/assessments/:id/supplement`
- **Skills**: `GET /api/skills/analytics`, `GET /api/skills/history`
- **AI**: `POST /api/ai/analyze`, `POST /api/ai/roadmap`, `POST /api/ai/chat`

## GitHub Source Code Synchronization

- In **Google AI Studio**, use the **Save to GitHub / Export to GitHub** option in the AI Studio project toolbar to connect or create your `skillproof` repository.
- Ensure `.env` remains excluded (`.gitignore` already ignores `.env*`, `.data/`, `node_modules/`, and `dist/` while preserving `.env.example`).
