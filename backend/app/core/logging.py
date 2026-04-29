import logging
import time
import uuid

from fastapi import Request


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s request_id=%(request_id)s %(name)s %(message)s",
    )


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    start = time.perf_counter()
    logger = logging.getLogger("control_center.request")
    try:
        response = await call_next(request)
    finally:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "%s %s completed in %sms",
            request.method,
            request.url.path,
            elapsed_ms,
            extra={"request_id": request_id},
        )
    response.headers["x-request-id"] = request_id
    return response
