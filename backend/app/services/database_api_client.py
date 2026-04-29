import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.core.config import settings
from app.core.responses import ApiError


class DatabaseApiClient:
    def __init__(self, base_url: str = settings.database_api_base, timeout: float = settings.upstream_timeout):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{path}"
        data = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else None
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise ApiError("UPSTREAM_API_UNAVAILABLE", details={"url": url, "reason": str(exc)}, status_code=503) from exc

    def health(self) -> Any:
        return self._request("GET", "/health")

    def backend_search(self, query: str, limit: int) -> Any:
        params = urllib.parse.urlencode({"q": query, "limit": limit})
        return self._request("GET", f"/backend/search?{params}")

    def brief(self, payload: dict[str, Any]) -> Any:
        return self._request("POST", "/brief", payload)


api_client = DatabaseApiClient()
