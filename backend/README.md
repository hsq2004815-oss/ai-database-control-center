# Backend

FastAPI read-only API for the independent Personal AI Database Control Center.

This backend is part of this repository, not `E:\DataBase`. It runs on port `8876`, calls the upstream knowledge API on `http://127.0.0.1:8765` when available, and only reads `E:\DataBase` through allowlisted files or read-only SQLite access.

## Start

If the virtual environment does not exist:

```powershell
cd E:\Projects\personal-ai-db-control-center\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the backend:

```powershell
cd E:\Projects\personal-ai-db-control-center\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8876 --reload
```

The API reads `E:\DataBase` and calls `http://127.0.0.1:8765` when available. It does not write to the database, runtime SQLite files, or indexes.

## Validate

```powershell
python -m py_compile app\main.py
python ..\scripts\validate_project.py
```
