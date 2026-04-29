from typing import Any, Optional

from fastapi import Request
from fastapi.responses import JSONResponse


ERROR_MESSAGES = {
    "UPSTREAM_API_UNAVAILABLE": "The local knowledge API is unavailable.",
    "DOMAIN_NOT_FOUND": "The requested domain does not exist.",
    "INVALID_DOMAIN": "The requested domain is not allowed.",
    "INVALID_LIMIT": "Limit must be between 1 and 50.",
    "INVALID_QUERY": "Query must not be empty.",
    "FILE_NOT_FOUND": "The requested file was not found.",
    "REPORT_NOT_FOUND": "The requested report was not found.",
    "CHUNK_NOT_FOUND": "The requested chunk was not found.",
    "PATH_NOT_ALLOWED": "The requested path is not allowed.",
    "DB_NOT_FOUND": "The backend SQLite database was not found.",
    "DB_QUERY_FAILED": "The database query failed.",
    "INTERNAL_ERROR": "An internal error occurred.",
}


class ApiError(Exception):
    def __init__(self, code: str, message: Optional[str] = None, details: Optional[dict[str, Any]] = None, status_code: int = 400):
        self.code = code
        self.message = message or ERROR_MESSAGES.get(code, code)
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


def request_id_from(request: Request) -> str:
    return getattr(request.state, "request_id", "")


def ok(data: Any, request: Request) -> dict[str, Any]:
    return {"ok": True, "data": data, "error": None, "request_id": request_id_from(request)}


def fail(code: str, message: str, details: Optional[dict[str, Any]], request_id: str) -> dict[str, Any]:
    return {
        "ok": False,
        "data": None,
        "error": {"code": code, "message": message, "details": details or {}},
        "request_id": request_id,
    }


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=fail(exc.code, exc.message, exc.details, request_id_from(request)),
    )


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=fail("INTERNAL_ERROR", ERROR_MESSAGES["INTERNAL_ERROR"], {}, request_id_from(request)),
    )
