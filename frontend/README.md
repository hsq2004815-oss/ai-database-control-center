# Frontend

React + Vite control console for the backend API.

Default frontend port: `5173`.

Default backend API base: `http://127.0.0.1:8876`.

## Start

```powershell
cd E:\Projects\personal-ai-db-control-center\frontend
npm install
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8876`. Override with `VITE_API_BASE` if needed.

Pages:

- Dashboard
- Domains
- Search
- Backend Knowledge
- Reports
- Brief

Search and Brief support Agent Handoff Markdown export for Codex, opencode, and Claude Code. Copy and download actions run in the browser and do not write to `E:\DataBase`.
