# Task Memory

- Purpose: Independent fullstack control center for read-only browsing and retrieval against `E:\DataBase`.
- Key files: `backend/app/main.py`, `backend/app/services/filesystem_service.py`, `backend/app/services/search_service.py`, `frontend/src/App.jsx`, `frontend/src/styles.css`, `scripts/validate_project.py`.
- Startup/test: backend `python -m uvicorn app.main:app --host 127.0.0.1 --port 8876`; frontend `npm install` then `npm run dev`; validation `python scripts/validate_project.py`.
- Last completed: Created FastAPI backend, Vite React console, docs, API reference, report, and validation scripts in `E:\Projects\personal-ai-db-control-center`.
- Verification: backend `py_compile` passed; `validate_project.py` passed via direct router handlers; backend chunk lookup and upstream `/brief` proxy were checked.
- Known traps: Do not edit/copy/reindex `E:\DataBase`; SQLite connection is intentionally read-only; frontend dependencies are not installed yet.
- Next likely edit points: improve cross-domain search ranking, add frontend build verification after `npm install`, add token auth in V1.3.
