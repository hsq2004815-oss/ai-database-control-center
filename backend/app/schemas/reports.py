from pydantic import BaseModel


class ReportMeta(BaseModel):
    name: str
    relative_path: str
    size: int
    modified_at: str
    phase: str
    title: str


class ReportContent(BaseModel):
    name: str
    relative_path: str
    content: str
    truncated: bool
    max_chars: int
