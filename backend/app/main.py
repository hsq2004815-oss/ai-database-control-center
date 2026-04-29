from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging, request_context_middleware
from app.core.responses import ApiError, api_error_handler, unhandled_error_handler
from app.routers import backend_files, brief, domains, health, reports, search

configure_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Read-only control center API for E:\\DataBase.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.middleware("http")(request_context_middleware)
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

app.include_router(health.router)
app.include_router(domains.router)
app.include_router(search.router)
app.include_router(brief.router)
app.include_router(reports.router)
app.include_router(backend_files.router)


@app.get("/")
def root():
    return {
        "ok": True,
        "data": {"app_name": settings.app_name, "version": settings.version, "docs": "/docs"},
        "error": None,
        "request_id": "",
    }
