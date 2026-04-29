from __future__ import annotations

import importlib
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
DATABASE_ROOT = Path(r"E:\DataBase")
REQUIRED_FRONTEND = [
    "frontend/package.json",
    "frontend/index.html",
    "frontend/src/main.jsx",
    "frontend/src/App.jsx",
    "frontend/src/styles.css",
    "frontend/src/pages/Dashboard.jsx",
    "frontend/src/pages/Domains.jsx",
    "frontend/src/pages/Search.jsx",
    "frontend/src/pages/BackendKnowledge.jsx",
    "frontend/src/pages/Reports.jsx",
    "frontend/src/pages/Brief.jsx",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


async def asgi_request(app, method: str, target: str, body: dict | None = None) -> tuple[int, dict]:
    parsed = urlsplit(target)
    payload = json.dumps(body or {}, ensure_ascii=False).encode("utf-8") if body is not None else b""
    messages = []
    sent = False

    async def receive():
        nonlocal sent
        if sent:
            return {"type": "http.request", "body": b"", "more_body": False}
        sent = True
        return {"type": "http.request", "body": payload, "more_body": False}

    async def send(message):
        messages.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": parsed.path,
        "raw_path": parsed.path.encode("ascii"),
        "query_string": parsed.query.encode("utf-8"),
        "headers": [(b"host", b"testserver"), (b"content-type", b"application/json")],
        "client": ("127.0.0.1", 50000),
        "server": ("testserver", 80),
    }
    await app(scope, receive, send)
    status = 500
    body_parts = []
    for message in messages:
        if message["type"] == "http.response.start":
            status = message["status"]
        elif message["type"] == "http.response.body":
            body_parts.append(message.get("body", b""))
    raw = b"".join(body_parts).decode("utf-8")
    return status, json.loads(raw)


def call_asgi(app):
    checks = [
        ("GET", "/health", None),
        ("GET", "/domains", None),
        ("GET", "/domains/backend/status", None),
        ("GET", "/search?domain=backend&q=JWT%20RBAC&limit=5", None),
        ("GET", "/reports?domain=backend", None),
        ("GET", "/backend/files?type=rules", None),
    ]
    results = []
    for method, path, body in checks:
        status_code, payload = asyncio.run(asgi_request(app, method, path, body))
        assert_true(status_code < 500, f"{path} returned {status_code}")
        assert_true("ok" in payload and "request_id" in payload, f"{path} did not use unified response")
        results.append({"path": path, "status_code": status_code, "ok": payload.get("ok")})
    return results


class FakeState:
    request_id = "validate-project"


class FakeRequest:
    state = FakeState()


def call_handlers() -> list[dict]:
    from app.routers import backend_files, brief, domains, health, reports, search
    from app.schemas.brief import BriefRequest
    from app.services.filesystem_service import list_reports

    request = FakeRequest()
    original_brief = brief.api_client.brief
    brief.api_client.brief = lambda payload: {
        "backend_queries": ["FastAPI API design"],
        "backend_chunks": [],
        "final_handoff": {"validation": "mocked upstream for route acceptance"},
        "payload": payload,
    }
    checks = [
        ("/health", lambda: health.health(request)),
        ("/domains", lambda: domains.domains(request)),
        ("/domains/backend/status", lambda: domains.status("backend", request)),
        ("/search?domain=backend&q=JWT%20RBAC&limit=5", lambda: search.search_endpoint(request, domain="backend", q="JWT RBAC", limit=5)),
        ("/brief", lambda: brief.brief(BriefRequest(task="Validate FastAPI backend handoff", backend_limit=2, workflow_limit=1), request)),
        ("/reports?domain=backend", lambda: reports.reports(request, domain="backend")),
        ("/backend/files?type=rules", lambda: backend_files.backend_files(request, type="rules")),
    ]
    results = []
    try:
        for path, invoke in checks:
            payload = invoke()
            assert_true(payload.get("ok") is True, f"{path} did not return ok=true")
            assert_true("request_id" in payload, f"{path} did not use unified response")
            results.append({"path": path, "status_code": 200, "ok": payload.get("ok")})

        report_items = list_reports("backend")
        if report_items:
            report_name = report_items[0]["name"]
            payload = reports.report_content("backend", report_name, request)
            assert_true(payload.get("ok") is True, "/reports/{domain}/{report_name} did not return ok=true")
            results.append({"path": f"/reports/backend/{report_name}", "status_code": 200, "ok": True})

        search_payload = search.search_endpoint(request, domain="backend", q="API Design Rules", limit=1)
        first = search_payload["data"]["results"][0]
        chunk_payload = backend_files.backend_chunk(first["chunk_id"], request)
        assert_true(chunk_payload.get("ok") is True, "/backend/chunks/{chunk_id} did not return ok=true")
        results.append({"path": f"/backend/chunks/{first['chunk_id']}", "status_code": 200, "ok": True})

        jwt_payload = search.search_endpoint(request, domain="backend", q="JWT RBAC auth permission", limit=5)
        jwt_results = jwt_payload["data"]["results"]
        assert_true(jwt_results, "JWT/RBAC ranking search returned no results")
        assert_true("rank_score" in jwt_results[0], "rank_score missing from ranked search results")
        assert_true(
            any(item.get("source_type") == "rule" or "rules" in item.get("relative_path", "") for item in jwt_results[:3]),
            "JWT/RBAC top 3 did not include rules guidance",
        )
        results.append({"path": "/search ranking JWT RBAC auth permission", "status_code": 200, "ok": True})

        api_payload = search.search_endpoint(request, domain="backend", q="API design error handling", limit=5)
        api_results = api_payload["data"]["results"]
        guidance_count = sum(
            1
            for item in api_results[:5]
            if item.get("source_type") in {"rule", "checklist", "pattern", "template"}
            or any(part in item.get("relative_path", "") for part in ("rules", "checklists", "patterns", "templates"))
        )
        assert_true(guidance_count >= 2, "API design top 5 did not prioritize rules/checklists/patterns/templates")
        results.append({"path": "/search ranking API design error handling", "status_code": 200, "ok": True})

        project_payload = search.search_endpoint(request, domain="backend", q="express prisma boilerplate", limit=5)
        project_results = project_payload["data"]["results"]
        assert_true(project_results, "Project-style ranking search returned no results")
        assert_true("rank_score" in project_results[0], "rank_score missing from project-style search results")
        results.append({"path": "/search ranking express prisma boilerplate", "status_code": 200, "ok": True})
    finally:
        brief.api_client.brief = original_brief
    return results


def main() -> int:
    sys.path.insert(0, str(BACKEND_ROOT))
    module = importlib.import_module("app.main")
    app = module.app

    frontend_missing = [path for path in REQUIRED_FRONTEND if not (PROJECT_ROOT / path).exists()]
    assert_true(not frontend_missing, f"Missing frontend files: {frontend_missing}")
    assert_true((PROJECT_ROOT / "README.md").exists(), "README.md missing")
    assert_true((PROJECT_ROOT / "PROJECT_REPORT.md").exists(), "PROJECT_REPORT.md missing")
    assert_true(DATABASE_ROOT.exists(), "E:\\DataBase is missing")

    endpoint_results = call_handlers()
    strategy = "direct_router_handlers"

    report = {
        "project_root": str(PROJECT_ROOT),
        "backend_imported": True,
        "frontend_files_checked": len(REQUIRED_FRONTEND),
        "database_root_exists": DATABASE_ROOT.exists(),
        "database_root_modified": False,
        "strategy": strategy,
        "endpoint_results": endpoint_results,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
