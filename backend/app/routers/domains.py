from fastapi import APIRouter, Request

from app.core.responses import ok
from app.services.domain_service import domain_status, list_domains

router = APIRouter(prefix="/domains")


@router.get("")
def domains(request: Request):
    return ok({"domains": list_domains()}, request)


@router.get("/{domain}/status")
def status(domain: str, request: Request):
    return ok(domain_status(domain), request)
