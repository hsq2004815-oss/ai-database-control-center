# API Reference

All project endpoints return:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "request_id": ""
}
```

Errors return `ok: false` with `error.code`, `error.message`, and `error.details`.

## Endpoints

- `GET /health` - app health, database root status, upstream API status, endpoint list.
- `GET /domains` - allowed domain list and available operations.
- `GET /domains/{domain}/status` - per-domain file/index status.
- `GET /search?domain=backend&q=JWT RBAC&limit=5` - backend/upstream search with SQLite fallback.
- `GET /search?domain=all&q=dashboard&limit=5` - lightweight multi-domain aggregation.
- `POST /brief` - proxies the local database `/brief` endpoint and preserves upstream structure.
- `GET /reports?domain=backend` - report metadata from `output/reports`.
- `GET /reports/{domain}/{report_name}` - report markdown preview, filename-only and `.md` only.
- `GET /backend/files?type=rules` - backend file metadata for `rules`, `topics`, `patterns`, `checklists`, `templates`, `references`, or `reports`.
- `GET /backend/chunks/{chunk_id}` - read one backend chunk from the SQLite index in read-only mode.

## Error Codes

`UPSTREAM_API_UNAVAILABLE`, `DOMAIN_NOT_FOUND`, `INVALID_DOMAIN`, `INVALID_LIMIT`, `INVALID_QUERY`, `FILE_NOT_FOUND`, `REPORT_NOT_FOUND`, `CHUNK_NOT_FOUND`, `PATH_NOT_ALLOWED`, `DB_NOT_FOUND`, `DB_QUERY_FAILED`, `INTERNAL_ERROR`.
