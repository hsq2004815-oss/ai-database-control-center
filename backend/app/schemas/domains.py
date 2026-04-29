from pydantic import BaseModel, Field


class DomainInfo(BaseModel):
    domain: str
    display_name: str
    exists: bool
    description: str
    local_path: str
    status: str
    available_sources: list[str] = Field(default_factory=list)
    available_operations: list[str] = Field(default_factory=list)
