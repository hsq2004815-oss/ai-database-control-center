# Backend

FastAPI read-only API for the independent Personal AI Database Control Center.

## Start

```powershell
cd E:\Projects\personal-ai-db-control-center\backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8876
```

The API reads `E:\DataBase` and calls `http://127.0.0.1:8765` when available. It does not write to the database, runtime SQLite files, or indexes.

## Validate

```powershell
python -m py_compile app\main.py
python ..\scripts\validate_project.py
```
