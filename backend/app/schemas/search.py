from typing import Any

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    chunk_id: str
    source_type: str = ""
    title: str = ""
    relative_path: str = ""
    section: str = ""
    content: str = ""
    summary: str = ""
    tags: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    priority: str = ""
    trust_level: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchResponse(BaseModel):
    domain: str
    query: str
    limit: int
    source: str
    results: list[SearchResult] = Field(default_factory=list)
