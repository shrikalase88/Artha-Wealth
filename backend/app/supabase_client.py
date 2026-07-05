"""Supabase REST API client wrapper — replaces direct SQLAlchemy connection."""

from collections.abc import Generator
from typing import Any

import httpx
from app.core.config import settings


class SupabaseResponse:
    """Wraps an httpx response for the REST API."""

    def __init__(self, data: Any, status_code: int):
        self.data = data
        self.status_code = status_code

    def execute(self) -> "SupabaseResponse":
        return self

    def single(self) -> Any:
        if isinstance(self.data, list) and len(self.data) == 1:
            return self.data[0]
        if isinstance(self.data, dict):
            return self.data
        return self.data


class SupabaseQuery:
    """Fluent query builder for Supabase REST API."""

    def __init__(self, client: "SupabaseClient", table: str):
        self._client = client
        self._table = table
        self._params: dict[str, str] = {}
        self._headers: dict[str, str] = {
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self._method: str = "GET"
        self._body: Any = None
        self._path_suffix: str = ""

    def select(self, columns: str = "*") -> "SupabaseQuery":
        self._params["select"] = columns
        return self

    def eq(self, column: str, value: Any) -> "SupabaseQuery":
        self._params[f"{column}=eq.{value}"] = ""
        return self

    def neq(self, column: str, value: Any) -> "SupabaseQuery":
        self._params[f"{column}=neq.{value}"] = ""
        return self

    def order(self, column: str, direction: str = "asc") -> "SupabaseQuery":
        self._params["order"] = f"{column}.{direction}"
        return self

    def limit(self, count: int) -> "SupabaseQuery":
        self._params["limit"] = str(count)
        return self

    def insert(self, data: dict | list[dict]) -> "SupabaseQuery":
        self._method = "POST"
        self._body = data if isinstance(data, list) else [data]
        return self

    def upsert(self, data: dict, on_conflict: str = "id") -> "SupabaseQuery":
        self._method = "POST"
        self._body = [data]
        self._headers["Prefer"] = f"resolution=merge-duplicates,return=representation"
        return self

    def update(self, data: dict) -> "SupabaseQuery":
        self._method = "PATCH"
        self._body = data
        return self

    def delete(self) -> "SupabaseQuery":
        self._method = "DELETE"
        return self

    def execute(self) -> SupabaseResponse:
        url = f"{self._client.base_url}/rest/v1/{self._table}{self._path_suffix}"
        params = {k: v for k, v in self._params.items() if v != ""}
        clean_params = {}
        for k, v in self._params.items():
            if "=eq." in k:
                col, val = k.split("=eq.", 1)
                clean_params[col] = f"eq.{val}"
            elif "=neq." in k:
                col, val = k.split("=neq.", 1)
                clean_params[col] = f"neq.{val}"
            elif v == "":
                continue
            else:
                clean_params[k] = v

        headers = {
            **self._client.headers,
            **self._headers,
        }

        if self._method == "GET":
            resp = self._client.http.get(url, headers=headers, params=clean_params, timeout=30)
        elif self._method == "POST":
            resp = self._client.http.post(url, headers=headers, params=clean_params, json=self._body, timeout=30)
        elif self._method == "PATCH":
            resp = self._client.http.patch(url, headers=headers, params=clean_params, json=self._body, timeout=30)
        elif self._method == "DELETE":
            resp = self._client.http.delete(url, headers=headers, params=clean_params, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {self._method}")

        resp.raise_for_status()
        return SupabaseResponse(
            data=resp.json() if resp.content else None,
            status_code=resp.status_code,
        )


class SupabaseClient:
    """Thin Supabase REST API client using service-role key."""

    def __init__(self):
        self.base_url = settings.supabase_url.rstrip("/")
        self.service_key = settings.supabase_service_role_key
        self.http = httpx.Client()
        self.headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
        }

    def from_table(self, table: str) -> SupabaseQuery:
        return SupabaseQuery(self, table)

    def storage_download(self, bucket: str, path: str) -> bytes:
        url = f"{self.base_url}/storage/v1/object/{bucket}/{path}"
        resp = self.http.get(url, headers=self.headers, timeout=60)
        resp.raise_for_status()
        return resp.content

    def storage_upload(self, bucket: str, path: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        url = f"{self.base_url}/storage/v1/object/{bucket}/{path}"
        resp = self.http.post(
            url,
            headers={**self.headers, "Content-Type": content_type},
            content=data,
            timeout=60,
        )
        if resp.status_code not in (200, 201):
            # Try upsert
            resp = self.http.put(
                url,
                headers={**self.headers, "Content-Type": content_type},
                content=data,
                timeout=60,
            )
            resp.raise_for_status()


_client_instance: SupabaseClient | None = None


def get_supabase() -> SupabaseClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = SupabaseClient()
    return _client_instance
