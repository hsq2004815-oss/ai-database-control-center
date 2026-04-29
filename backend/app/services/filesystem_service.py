import json
from datetime import datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.responses import ApiError


DOMAINS: dict[str, dict[str, str]] = {
    "ui_design": {"display_name": "UI Design", "description": "Premium UI rules, design references, and interface patterns."},
    "ui_assets": {"display_name": "UI Assets", "description": "Local UI asset metadata, thumbnails, and inspiration-only material records."},
    "agent_workflow": {"display_name": "Agent Workflow", "description": "Reusable agent workflows for API-first and knowledge-first development."},
    "automation": {"display_name": "Automation", "description": "Browser automation, CDP, Playwright, selectors, and workflow guidance."},
    "backend": {"display_name": "Backend Engineering", "description": "Backend rules, FastAPI templates, chunks, reports, and SQLite retrieval index."},
}

BACKEND_FILE_TYPES: dict[str, list[str]] = {
    "rules": ["rules"],
    "topics": ["wiki/topics"],
    "patterns": ["wiki/patterns"],
    "checklists": ["wiki/checklists"],
    "templates": ["wiki/templates"],
    "references": ["references"],
    "reports": ["output/reports"],
}

BLOCKED_PARTS = {".env", ".git", "node_modules", "venv", ".venv", "__pycache__"}
BLOCKED_SUFFIXES = {".bak", ".key", ".pem", ".p12", ".pfx"}


def utc_mtime(path: Path) -> str:
    return datetime.utcfromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds") + "Z"


def domain_path(domain: str) -> Path:
    validate_domain(domain)
    return settings.database_root / "domains" / domain


def validate_domain(domain: str) -> None:
    if domain not in DOMAINS:
        raise ApiError("INVALID_DOMAIN", details={"domain": domain}, status_code=400)


def ensure_inside_database(path: Path) -> Path:
    root = settings.database_root.resolve()
    resolved = path.resolve()
    if root != resolved and root not in resolved.parents:
        raise ApiError("PATH_NOT_ALLOWED", details={"path": str(path)}, status_code=403)
    return resolved


def is_safe_file(path: Path) -> bool:
    lowered = {part.lower() for part in path.parts}
    if lowered & BLOCKED_PARTS:
        return False
    if path.suffix.lower() in BLOCKED_SUFFIXES:
        return False
    if path.name.lower().endswith((".bak", ".backup")):
        return False
    return True


def file_title(path: Path) -> str:
    if path.suffix.lower() == ".md":
        try:
            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
                if line.startswith("#"):
                    return line.lstrip("#").strip() or path.stem
        except OSError:
            return path.stem
    return path.stem


def relative_to_database(path: Path) -> str:
    return str(path.resolve().relative_to(settings.database_root.resolve())).replace("\\", "/")


def safe_list_files(base: Path, extensions: set[str] | None = None, limit: int = 500) -> list[dict[str, Any]]:
    base = ensure_inside_database(base)
    if not base.exists():
        return []
    results: list[dict[str, Any]] = []
    for item in base.rglob("*"):
        if not item.is_file() or not is_safe_file(item):
            continue
        if extensions and item.suffix.lower() not in extensions:
            continue
        results.append(
            {
                "name": item.name,
                "relative_path": relative_to_database(item),
                "size": item.stat().st_size,
                "modified_at": utc_mtime(item),
                "title": file_title(item),
                "source_type": item.suffix.lower().lstrip("."),
            }
        )
        if len(results) >= limit:
            break
    return sorted(results, key=lambda row: row["relative_path"])


def count_files(base: Path, extensions: set[str] | None = None) -> int:
    return len(safe_list_files(base, extensions=extensions, limit=10000))


def read_json(path: Path) -> Any:
    path = ensure_inside_database(path)
    if not path.exists() or not path.is_file() or not is_safe_file(path):
        raise ApiError("FILE_NOT_FOUND", details={"path": relative_to_database(path) if path.exists() else str(path)}, status_code=404)
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def get_backend_file_dirs(file_type: str) -> list[Path]:
    if file_type not in BACKEND_FILE_TYPES:
        raise ApiError("INVALID_QUERY", "Unsupported backend file type.", {"type": file_type}, status_code=400)
    return [domain_path("backend") / rel for rel in BACKEND_FILE_TYPES[file_type]]


def list_backend_files(file_type: str) -> list[dict[str, Any]]:
    files: list[dict[str, Any]] = []
    extensions = {".md", ".json"} if file_type == "references" else {".md"}
    if file_type == "reports":
        extensions = {".md"}
    for base in get_backend_file_dirs(file_type):
        files.extend(safe_list_files(base, extensions=extensions))
    return files


def list_reports(domain: str) -> list[dict[str, Any]]:
    validate_domain(domain)
    base = domain_path(domain) / "output" / "reports"
    reports = []
    for item in safe_list_files(base, extensions={".md"}):
        phase = Path(item["name"]).stem.split("-")[0] if "-" in item["name"] else "report"
        reports.append({**item, "phase": phase, "title": item["title"] or Path(item["name"]).stem})
    return reports


def read_report(domain: str, report_name: str) -> dict[str, Any]:
    validate_domain(domain)
    if report_name != Path(report_name).name or ".." in report_name or "/" in report_name or "\\" in report_name:
        raise ApiError("PATH_NOT_ALLOWED", details={"report_name": report_name}, status_code=403)
    if not report_name.endswith(".md"):
        raise ApiError("REPORT_NOT_FOUND", details={"report_name": report_name}, status_code=404)
    path = ensure_inside_database(domain_path(domain) / "output" / "reports" / report_name)
    if not path.exists() or not path.is_file() or not is_safe_file(path):
        raise ApiError("REPORT_NOT_FOUND", details={"report_name": report_name}, status_code=404)
    content = path.read_text(encoding="utf-8", errors="ignore")
    max_chars = settings.max_report_chars
    return {
        "name": path.name,
        "relative_path": relative_to_database(path),
        "content": content[:max_chars],
        "truncated": len(content) > max_chars,
        "max_chars": max_chars,
    }
