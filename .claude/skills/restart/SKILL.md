---
name: restart
description: Restart the CXPro dev stack (Next.js frontend + FastAPI backend). Kills existing processes and relaunches both services in the background, then tails logs to confirm startup. Use when user says "restart", "restart the app", "restart the server", "restart dev", or the app seems broken/stale.
---

# Restart Dev Stack

Kills and restarts both services for this project.

## Steps

1. Kill existing processes:
```bash
pkill -f "npm run dev" 2>/dev/null; pkill -f "uvicorn main:app" 2>/dev/null; sleep 1
```

2. Start frontend (Next.js):
```bash
cd /Users/shlok/Desktop/SpareWork/CX/frontend && npm run dev > /tmp/frontend.log 2>&1 &
echo "Frontend PID: $!"
```

3. Start backend (FastAPI/uvicorn):
```bash
cd /Users/shlok/Desktop/SpareWork/CX/backend && uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
echo "Backend PID: $!"
```

4. Wait and confirm:
```bash
sleep 3 && echo "=== Frontend ===" && tail -5 /tmp/frontend.log && echo "=== Backend ===" && tail -5 /tmp/backend.log
```

## Expected output

- Frontend: Next.js dev server ready on `http://localhost:3000`
- Backend: `Uvicorn running on http://127.0.0.1:8000`

## Log files

- Frontend: `/tmp/frontend.log`
- Backend: `/tmp/backend.log`
