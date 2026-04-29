from typing import Any, Optional

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ApiResponse(BaseModel):
    ok: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    request_id: str = ""


class FileMeta(BaseModel):
    name: str
    relative_path: str
    size: int
    modified_at: str
    title: str | None = None
    source_type: str | None = None
