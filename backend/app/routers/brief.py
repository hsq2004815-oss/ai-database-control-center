from fastapi import APIRouter, Request

from app.core.responses import ok
from app.schemas.brief import BriefRequest
from app.services.database_api_client import api_client

router = APIRouter()


@router.post("/brief")
def brief(payload: BriefRequest, request: Request):
    body = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    upstream = api_client.brief(body)
    return ok(upstream, request)
