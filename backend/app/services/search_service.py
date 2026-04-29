import json
import sqlite3
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.responses import ApiError
from app.services.database_api_client import api_client
from app.services.filesystem_service import DOMAINS, domain_path, safe_list_files


def validate_limit(limit: int) -> None:
    if limit < 1 or limit > 50:
        raise ApiError("INVALID_LIMIT", status_code=400)


def validate_query(q: str) -> str:
    value = (q or "").strip()
    if not value:
        raise ApiError("INVALID_QUERY", status_code=400)
    return value


def search(domain: str, q: str, limit: int) -> dict[str, Any]:
    query = validate_query(q)
    validate_limit(limit)
    if domain not in DOMAINS and domain != "all":
        raise ApiError("INVALID_DOMAIN", details={"domain": domain}, status_code=400)
    if domain == "backend":
        try:
            upstream = api_client.backend_search(query, limit)
            return {"domain": domain, "query": query, "limit": limit, "source": "upstream_api", "results": normalize_upstream_results(upstream)}
        except ApiError:
            return {"domain": domain, "query": query, "limit": limit, "source": "sqlite_fallback", "results": search_backend_sqlite(query, limit)}
    if domain == "all":
        backend_results = []
        try:
            backend_results = normalize_upstream_results(api_client.backend_search(query, min(limit, 10)))
        except ApiError:
            backend_results = search_backend_sqlite(query, min(limit, 10))
        metadata_results = search_domain_files(query, limit, exclude={"backend"})
        return {"domain": domain, "query": query, "limit": limit, "source": "aggregate", "results": (backend_results + metadata_results)[:limit]}
    return {"domain": domain, "query": query, "limit": limit, "source": "filesystem_metadata", "results": search_domain_files(query, limit, include={domain})}


def normalize_upstream_results(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict) and "results" in payload:
        rows = payload["results"]
    elif isinstance(payload, list):
        rows = payload
    else:
        rows = []
    results = []
    for row in rows:
        metadata = row.get("metadata") if isinstance(row, dict) else {}
        results.append(
            {
                "chunk_id": row.get("chunk_id", ""),
                "source_type": row.get("source_type", ""),
                "title": row.get("title", ""),
                "relative_path": row.get("relative_path", ""),
                "section": row.get("section", ""),
                "content": row.get("content", ""),
                "summary": row.get("summary", ""),
                "tags": row.get("tags", []),
                "keywords": row.get("keywords", []),
                "priority": row.get("priority", ""),
                "trust_level": row.get("trust_level", ""),
                "metadata": metadata or {},
            }
        )
    return results


def parse_json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def row_to_result(row: sqlite3.Row) -> dict[str, Any]:
    try:
        metadata = json.loads(row["metadata_json"] or "{}")
    except json.JSONDecodeError:
        metadata = {}
    return {
        "chunk_id": row["chunk_id"],
        "source_type": row["source_type"],
        "title": row["title"],
        "relative_path": row["relative_path"],
        "section": row["section"],
        "content": row["content"],
        "summary": row["summary"],
        "tags": parse_json_list(row["tags_json"]),
        "keywords": parse_json_list(row["keywords_json"]),
        "priority": row["priority"],
        "trust_level": row["trust_level"],
        "metadata": metadata,
    }


def connect_backend_db() -> sqlite3.Connection:
    if not settings.backend_db_path.exists():
        raise ApiError("DB_NOT_FOUND", details={"path": str(settings.backend_db_path)}, status_code=404)
    uri = f"file:{settings.backend_db_path.as_posix()}?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    con.row_factory = sqlite3.Row
    return con


def fts_query(query: str) -> str:
    parts = [part.replace('"', "") for part in query.split() if part.strip()]
    return " ".join(parts) if parts else query


def search_backend_sqlite(query: str, limit: int) -> list[dict[str, Any]]:
    try:
        with connect_backend_db() as con:
            try:
                rows = con.execute(
                    """
                    SELECT c.*
                    FROM backend_chunks_fts f
                    JOIN backend_chunks c ON c.chunk_id = f.chunk_id
                    WHERE backend_chunks_fts MATCH ?
                    LIMIT ?
                    """,
                    (fts_query(query), limit),
                ).fetchall()
            except sqlite3.DatabaseError:
                like = f"%{query}%"
                rows = con.execute(
                    """
                    SELECT *
                    FROM backend_chunks
                    WHERE title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags_json LIKE ?
                    LIMIT ?
                    """,
                    (like, like, like, like, limit),
                ).fetchall()
            return [row_to_result(row) for row in rows]
    except ApiError:
        raise
    except sqlite3.DatabaseError as exc:
        raise ApiError("DB_QUERY_FAILED", details={"reason": str(exc)}, status_code=500) from exc


def get_chunk(chunk_id: str) -> dict[str, Any]:
    try:
        with connect_backend_db() as con:
            row = con.execute("SELECT * FROM backend_chunks WHERE chunk_id = ?", (chunk_id,)).fetchone()
            if row is None:
                raise ApiError("CHUNK_NOT_FOUND", details={"chunk_id": chunk_id}, status_code=404)
            return row_to_result(row)
    except ApiError:
        raise
    except sqlite3.DatabaseError as exc:
        raise ApiError("DB_QUERY_FAILED", details={"reason": str(exc)}, status_code=500) from exc


def search_domain_files(query: str, limit: int, include: set[str] | None = None, exclude: set[str] | None = None) -> list[dict[str, Any]]:
    include = include or set(DOMAINS)
    exclude = exclude or set()
    q_lower = query.lower()
    results = []
    for domain in sorted(include - exclude):
        for file_meta in safe_list_files(domain_path(domain), extensions={".md", ".json", ".txt"}, limit=200):
            haystack = f"{file_meta['name']} {file_meta['relative_path']} {file_meta.get('title') or ''}".lower()
            if q_lower in haystack or any(part in haystack for part in q_lower.split()):
                results.append(
                    {
                        "chunk_id": f"{domain}:{file_meta['relative_path']}",
                        "source_type": "file_metadata",
                        "title": file_meta.get("title") or file_meta["name"],
                        "relative_path": file_meta["relative_path"],
                        "section": "",
                        "content": "",
                        "summary": f"{domain} file: {file_meta['relative_path']}",
                        "tags": [domain],
                        "keywords": query.split(),
                        "priority": "medium",
                        "trust_level": "metadata",
                        "metadata": file_meta,
                    }
                )
                if len(results) >= limit:
                    return results
    return results
