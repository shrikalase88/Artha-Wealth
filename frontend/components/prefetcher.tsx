"use client";

import { useEffect } from "react";
import { preload } from "swr";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-hhls4780t-shrikant-kalase-s-projects.vercel.app";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Prefetcher() {
  useEffect(() => {
    preload(`${BACKEND_URL}/api/v1/market/summary`, fetcher);
    preload(`${BACKEND_URL}/api/v1/market/currency`, fetcher);
    preload(`${BACKEND_URL}/api/v1/market/top-funds`, fetcher);
  }, []);

  return null;
}
