from pydantic import BaseModel, Field


class BriefRequest(BaseModel):
    task: str = Field(min_length=1)
    ui_limit: int = Field(default=0, ge=0, le=50)
    backend_limit: int = Field(default=8, ge=0, le=50)
    workflow_limit: int = Field(default=2, ge=0, le=50)
    automation_limit: int = Field(default=0, ge=0, le=50)
    assets_limit: int = Field(default=0, ge=0, le=50)
