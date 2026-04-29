from fastapi import APIRouter, Query, Request

from app.core.responses import ok
from app.services.filesystem_service import list_backend_files
from app.services.search_service import get_chunk

router = APIRouter(prefix="/backend")


@router.get("/files")
def backend_files(request: Request, type: str = Query("rules")):
    return ok({"type": type, "files": list_backend_files(type)}, request)


@router.get("/chunks/{chunk_id}")
def backend_chunk(chunk_id: str, request: Request):
    return ok(get_chunk(chunk_id), request)
