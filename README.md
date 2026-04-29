# Personal AI Database Control Center

独立全栈项目，用于只读管理和浏览本地个人 AI 数据库 `E:\DataBase`。它不是 `E:\DataBase` 本体的一部分，也不修改 `E:\DataBase\backend_api`、`E:\DataBase\runtime\db` 或任何索引文件。

## What It Does

- 通过本项目 backend 统一封装只读 API。
- 优先调用已有知识库 API `http://127.0.0.1:8765`。
- 上游不可用时，后端可只读读取 `E:\DataBase` 的 manifest、reports、README、rules，以及 backend SQLite 检索索引。
- 前端提供 Dashboard、Domains、Search、Backend Knowledge、Reports、Brief 页面。

## Backend Start

```powershell
cd E:\Projects\personal-ai-db-control-center\backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8876
```

## Frontend Start

```powershell
cd E:\Projects\personal-ai-db-control-center\frontend
npm install
npm run dev
```

Frontend default API base: `http://127.0.0.1:8876`.

## API Endpoints

- `GET /health`
- `GET /domains`
- `GET /domains/{domain}/status`
- `GET /search`
- `POST /brief`
- `GET /reports?domain=backend`
- `GET /reports/{domain}/{report_name}`
- `GET /backend/files?type=rules`
- `GET /backend/chunks/{chunk_id}`

See [docs/API.md](docs/API.md) for details.

## Frontend Pages

- Dashboard: upstream API, database root, domain cards, backend chunks/references/reports.
- Domains: allowed domain list and detail status.
- Search: query, domain selector, limit, result chunks and metadata.
- Backend Knowledge: rules, topics, patterns, checklists, templates, references, reports.
- Reports: report list and scrollable markdown preview.
- Brief: task input and per-domain retrieval limits, proxying upstream `/brief`.

## Codex / opencode Usage

Use this project as a separate control center repo. Agents should inspect this README, `docs/API.md`, and `PROJECT_REPORT.md`, then run backend validation before edits. Do not edit `E:\DataBase` from this project unless a future task explicitly changes the safety boundary.

## Current Limits

- V1 read-only.
- No login.
- No write APIs.
- No index rebuild.
- No embedding jobs.

## Roadmap

- V1.1 search weighting optimization.
- V1.2 more advanced UI.
- V1.3 simple token authentication.
- V1.4 index rebuild task entry with explicit human confirmation.
- V1.5 Agent SDK.
