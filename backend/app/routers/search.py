from fastapi import APIRouter, Query, Request

from app.core.responses import ok
from app.services.search_service import search

router = APIRouter()


@router.get("/search")
def search_endpoint(request: Request, domain: str = Query("backend"), q: str = Query(...), limit: int = Query(5)):
    return ok(search(domain, q, limit), request)
