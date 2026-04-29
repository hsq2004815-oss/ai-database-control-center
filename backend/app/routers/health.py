from fastapi import APIRouter, Request

from app.core.config import settings
from app.core.responses import ok
from app.services.database_api_client import api_client

router = APIRouter()


@router.get("/health")
def health(request: Request):
    upstream_available = False
    upstream_health = None
    try:
        upstream_health = api_client.health()
        upstream_available = True
    except Exception:
        upstream_health = None
    return ok(
        {
            "status": "ok",
            "app_name": settings.app_name,
            "version": settings.version,
            "database_root": str(settings.database_root),
            "database_root_exists": settings.database_root.exists(),
            "upstream_api_base": settings.database_api_base,
            "upstream_api_available": upstream_available,
            "upstream_health": upstream_health,
            "available_endpoints": [
                "GET /health",
                "GET /domains",
                "GET /domains/{domain}/status",
                "GET /search",
                "POST /brief",
                "GET /reports",
                "GET /reports/{domain}/{report_name}",
                "GET /backend/files",
                "GET /backend/chunks/{chunk_id}",
            ],
        },
        request,
    )
