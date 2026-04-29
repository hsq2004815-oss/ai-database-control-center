from fastapi import APIRouter, Query, Request

from app.core.responses import ok
from app.services.filesystem_service import list_reports, read_report

router = APIRouter(prefix="/reports")


@router.get("")
def reports(request: Request, domain: str = Query("backend")):
    return ok({"domain": domain, "reports": list_reports(domain)}, request)


@router.get("/{domain}/{report_name}")
def report_content(domain: str, report_name: str, request: Request):
    return ok(read_report(domain, report_name), request)
