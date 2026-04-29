import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.responses import ApiError
from app.services.database_api_client import api_client
from app.services.filesystem_service import DOMAINS, domain_path, safe_list_files


SOURCE_TYPE_WEIGHTS = {
    "rule": 100,
    "checklist": 90,
    "template": 80,
    "pattern": 75,
    "topic": 65,
    "reference": 55,
    "github_project_analysis": 35,
    "github_project_chunk": 30,
    "file_metadata": 20,
    "unknown": 10,
}

PRIORITY_WEIGHTS = {
    "high": 30,
    "medium": 15,
    "low": 0,
}

TRUST_LEVEL_WEIGHTS = {
    "core_reference": 20,
    "good_reference": 12,
    "not_applicable": 8,
    "metadata": 5,
    "sample_only": -10,
    "low_reference": -20,
}

PATH_WEIGHTS = [
    ("domains/backend/rules", 30),
    ("domains/backend/wiki/checklists", 25),
    ("domains/backend/wiki/templates", 22),
    ("domains/backend/wiki/patterns", 20),
    ("domains/backend/wiki/topics", 15),
    ("domains/backend/references", 10),
    ("processed/metadata/github_projects", -5),
    ("processed/chunks/github_projects", -5),
]

CORE_GUIDANCE_TYPES = {"rule", "checklist", "template", "pattern"}
PROJECT_SOURCE_TYPES = {"github_project_analysis", "github_project_chunk"}
RULE_QUERY_TERMS = {
    "jwt",
    "rbac",
    "auth",
    "permission",
    "permissions",
    "api",
    "design",
    "error",
    "handling",
    "database",
    "modeling",
    "security",
    "checklist",
    "docker",
    "env",
    "rag",
    "backend",
}
PROJECT_QUERY_TERMS = {
    "fastapi",
    "express",
    "prisma",
    "boilerplate",
    "starter",
    "github",
    "project",
    "repo",
    "repository",
    "case",
    "analysis",
    "best",
    "practices",
    "项目",
    "项目分析",
}
PROJECT_QUERY_PHRASES = {"starter kit", "template repo", "github project", "project analysis", "best practices", "项目分析"}


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
    candidate_limit = expanded_candidate_limit(limit)
    if domain == "backend":
        try:
            upstream = api_client.backend_search(query, candidate_limit)
            results = rerank_results(normalize_upstream_results(upstream), query, limit)
            return {"domain": domain, "query": query, "limit": limit, "source": "upstream_api", "results": results}
        except ApiError:
            results = rerank_results(search_backend_sqlite(query, candidate_limit), query, limit)
            return {"domain": domain, "query": query, "limit": limit, "source": "sqlite_fallback", "results": results}
    if domain == "all":
        backend_results = []
        try:
            backend_results = normalize_upstream_results(api_client.backend_search(query, candidate_limit))
        except ApiError:
            backend_results = search_backend_sqlite(query, candidate_limit)
        metadata_results = search_domain_files(query, limit, exclude={"backend"})
        return {"domain": domain, "query": query, "limit": limit, "source": "aggregate", "results": rerank_results(backend_results + metadata_results, query, limit)}
    return {"domain": domain, "query": query, "limit": limit, "source": "filesystem_metadata", "results": search_domain_files(query, limit, include={domain})}


def expanded_candidate_limit(limit: int) -> int:
    return min(max(limit * 4, 20), 50)


def normalize_text(value: Any) -> str:
    if isinstance(value, (list, tuple, set)):
        return " ".join(normalize_text(item) for item in value)
    if isinstance(value, dict):
        return " ".join(f"{key} {normalize_text(item)}" for key, item in value.items())
    return str(value or "").lower()


def query_terms(query: str) -> set[str]:
    terms = {part for part in re.findall(r"[a-z0-9_]+|[\u4e00-\u9fff]+", query.lower()) if len(part) > 1}
    return terms or {query.lower().strip()}


def has_term_match(terms: set[str], value: Any) -> bool:
    text = normalize_text(value)
    return any(term in text for term in terms)


def source_type_for(result: dict[str, Any]) -> str:
    source_type = normalize_text(result.get("source_type")).strip() or "unknown"
    if source_type in SOURCE_TYPE_WEIGHTS:
        return source_type
    relative_path = normalize_text(result.get("relative_path"))
    if "/rules/" in f"/{relative_path}" or relative_path.startswith("domains/backend/rules"):
        return "rule"
    if "wiki/checklists" in relative_path:
        return "checklist"
    if "wiki/templates" in relative_path:
        return "template"
    if "wiki/patterns" in relative_path:
        return "pattern"
    if "wiki/topics" in relative_path:
        return "topic"
    if "github_projects" in relative_path:
        return "github_project_chunk"
    return source_type


def is_project_query(query: str, terms: set[str]) -> bool:
    q_lower = query.lower()
    return any(phrase in q_lower for phrase in PROJECT_QUERY_PHRASES) or bool(terms & PROJECT_QUERY_TERMS)


def is_rule_query(query: str, terms: set[str]) -> bool:
    q_lower = query.lower()
    rule_phrase = any(phrase in q_lower for phrase in ("api design", "error handling", "database modeling", "security checklist", "docker env", "rag backend"))
    return rule_phrase or len(terms & RULE_QUERY_TERMS) >= 2


def rank_tier_for(result: dict[str, Any], source_type: str) -> str:
    relative_path = normalize_text(result.get("relative_path"))
    if source_type in CORE_GUIDANCE_TYPES:
        return "core_guidance"
    if source_type in {"topic", "reference"}:
        return "topic_or_reference"
    if source_type in PROJECT_SOURCE_TYPES or "github_projects" in relative_path:
        return "project_reference"
    return "metadata"


def add_score(score: int, reasons: list[str], amount: int, label: str) -> int:
    if amount:
        reasons.append(f"{label} {amount:+d}")
    return score + amount


def rank_search_result(result: dict[str, Any], query: str) -> dict[str, Any]:
    terms = query_terms(query)
    source_type = source_type_for(result)
    score = 0
    reasons: list[str] = []

    score = add_score(score, reasons, SOURCE_TYPE_WEIGHTS.get(source_type, SOURCE_TYPE_WEIGHTS["unknown"]), f"source:{source_type}")
    priority = normalize_text(result.get("priority")).strip()
    score = add_score(score, reasons, PRIORITY_WEIGHTS.get(priority, 0), f"priority:{priority or 'none'}")
    trust_level = normalize_text(result.get("trust_level")).strip()
    score = add_score(score, reasons, TRUST_LEVEL_WEIGHTS.get(trust_level, 0), f"trust:{trust_level or 'none'}")

    field_weights = [
        ("title match", 20, result.get("title")),
        ("section match", 12, result.get("section")),
        ("tags match", 15, [result.get("tags", []), result.get("keywords", [])]),
        ("summary match", 10, result.get("summary")),
        ("content match", 5, result.get("content")),
    ]
    for label, weight, value in field_weights:
        if has_term_match(terms, value):
            score = add_score(score, reasons, weight, label)

    relative_path = normalize_text(result.get("relative_path")).replace("\\", "/")
    for path_part, weight in PATH_WEIGHTS:
        if path_part in relative_path:
            score = add_score(score, reasons, weight, f"path:{path_part}")

    metadata_text = normalize_text(result.get("metadata"))
    combined_reference_text = " ".join([trust_level, relative_path, metadata_text])
    if "sample_only" in combined_reference_text:
        score = add_score(score, reasons, -15, "sample_only penalty")
    if "low_reference" in combined_reference_text:
        score = add_score(score, reasons, -30, "low_reference penalty")
    if not normalize_text(result.get("summary")) or len(normalize_text(result.get("content"))) < 80:
        score = add_score(score, reasons, -5, "thin content penalty")

    project_query = is_project_query(query, terms)
    rule_query = is_rule_query(query, terms)
    if rule_query and source_type in CORE_GUIDANCE_TYPES:
        score = add_score(score, reasons, 12, "rule-query guidance boost")
    if rule_query and source_type in PROJECT_SOURCE_TYPES:
        score = add_score(score, reasons, -10, "rule-query project penalty")
    if project_query and source_type == "github_project_analysis":
        score = add_score(score, reasons, 65, "project-query analysis boost")
    elif project_query and source_type == "github_project_chunk":
        score = add_score(score, reasons, 45, "project-query chunk boost")

    ranked = dict(result)
    ranked["rank_score"] = score
    ranked["rank_tier"] = rank_tier_for(result, source_type)
    ranked["rank_reason"] = "; ".join(reasons[:8])
    metadata = dict(ranked.get("metadata") or {})
    metadata.update({"rank_score": score, "rank_tier": ranked["rank_tier"], "rank_reason": ranked["rank_reason"]})
    ranked["metadata"] = metadata
    return ranked


def rerank_results(results: list[dict[str, Any]], query: str, limit: int) -> list[dict[str, Any]]:
    ranked = [rank_search_result(result, query) for result in results]
    ranked.sort(
        key=lambda item: (
            item.get("rank_score", 0),
            item.get("priority") == "high",
            item.get("source_type") in CORE_GUIDANCE_TYPES,
            item.get("title") or "",
        ),
        reverse=True,
    )
    return ranked[:limit]


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
