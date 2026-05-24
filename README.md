# CXPro

**Commissioning software built by engineers, for engineers.**

CXPro is a toolkit for teams who need reliable, scriptable automation in complex commissioning workflows. Built with the assumption that the people using it know what they're doing — no hand-holding, no unnecessary abstraction.

## Architecture

- **Frontend**: Next.js with TypeScript, Tailwind CSS, deployed on Vercel
- **Backend**: FastAPI with Python, deployed on Railway  
- **Database**: Supabase PostgreSQL with RLS
- **AI**: Google Gemini API for document processing and analysis

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Environment Variables

Copy the following variables to your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_connection_string
DATABASE_SECRET=your_supabase_service_role_key

# AI Services  
GEMINI_API_KEY=your_gemini_api_key

# Deployment (for CI/CD)
VERCEL_TOKEN=your_vercel_token
RAILWAY_TOKEN=your_railway_token
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.
Health check: `http://localhost:8000/health`

### Running Tests

Frontend tests:
```bash
cd frontend
npm run type-check
npm run lint
```

Backend tests:
```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest
```

### CI/CD

GitHub Actions automatically runs typecheck, ESLint, and pytest on every PR. Failures block merge.

ESLint is configured with `eslint-plugin-boundaries` to enforce module boundaries between contexts (identity/ and commissioning/).

## Philosophy

Commissioning work is technical, iterative, and unforgiving. The tools supporting it should be too. CXPro is designed to stay out of your way and let you move fast with confidence.

- **Scriptable by default** — every workflow is a script, not a GUI
- **Transparent execution** — you always know what's running and why
- **Built for iteration** — structured progress tracking so nothing gets lost between sessions

## License

MIT
