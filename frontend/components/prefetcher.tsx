"use client";

import { useEffect } from "react";
import { preload } from "swr";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const safeFetcher = (url: string) =>
  fetch(url)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

export function Prefetcher() {
  useEffect(() => {
    if (!BACKEND_URL) return;
    preload(`${BACKEND_URL}/api/v1/market/summary`, safeFetcher);
    preload(`${BACKEND_URL}/api/v1/market/currency`, safeFetcher);
    preload(`${BACKEND_URL}/api/v1/market/top-funds`, safeFetcher);
  }, []);

  return null;
}
