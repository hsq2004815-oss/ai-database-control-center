from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.filesystem_service import DOMAINS, count_files, domain_path, safe_list_files


def list_domains() -> list[dict[str, Any]]:
    domains = []
    for key, meta in DOMAINS.items():
        path = domain_path(key)
        exists = path.exists()
        domains.append(
            {
                "domain": key,
                "display_name": meta["display_name"],
                "exists": exists,
                "description": meta["description"],
                "local_path": str(path),
                "status": "ready" if exists else "missing",
                "available_sources": available_sources(key),
                "available_operations": available_operations(key),
            }
        )
    return domains


def available_sources(domain: str) -> list[str]:
    path = domain_path(domain)
    sources = []
    for name in ["README.md", "rules", "wiki", "references", "processed", "output", "registry"]:
        if (path / name).exists():
            sources.append(name)
    if domain == "backend" and settings.backend_db_path.exists():
        sources.append("runtime/db/sqlite/backend/backend_references.db")
    return sources


def available_operations(domain: str) -> list[str]:
    ops = ["status"]
    if domain == "backend":
        ops.extend(["search", "files", "chunks", "reports"])
    elif domain in {"ui_design", "ui_assets", "agent_workflow", "automation"}:
        ops.extend(["status", "lightweight_metadata"])
    return sorted(set(ops))


def domain_status(domain: str) -> dict[str, Any]:
    path = domain_path(domain)
    base = {
        "domain": domain,
        "local_path": str(path),
        "exists": path.exists(),
        "known_file_count": count_files(path, {".md", ".json", ".txt"}) if path.exists() else 0,
        "available_sources": available_sources(domain),
    }
    if domain != "backend":
        return base

    backend = path
    reports = safe_list_files(backend / "output" / "reports", extensions={".md"})
    return {
        **base,
        "readme_exists": (backend / "README.md").exists(),
        "rules_count": count_files(backend / "rules", {".md"}),
        "topics_count": count_files(backend / "wiki" / "topics", {".md"}),
        "patterns_count": count_files(backend / "wiki" / "patterns", {".md"}),
        "checklists_count": count_files(backend / "wiki" / "checklists", {".md"}),
        "templates_count": count_files(backend / "wiki" / "templates", {".md"}),
        "references_json_count": count_files(backend / "references", {".json"}),
        "retrieval_chunks_exists": (backend / "processed" / "retrieval" / "backend-retrieval-chunks.jsonl").exists(),
        "backend_sqlite_exists": settings.backend_db_path.exists(),
        "backend_index_manifest_exists": (backend / "processed" / "manifest" / "backend-index-manifest.json").exists(),
        "reports_count": len(reports),
    }
