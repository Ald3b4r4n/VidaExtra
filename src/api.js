// Centralized API base resolution with local emulator fallback
const LOCAL_BASES = [
  "http://localhost:5001/vidaextra-8db27/us-central1",
  "http://127.0.0.1:5001/vidaextra-8db27/us-central1",
  "http://localhost:5005/vidaextra-8db27/us-central1",
  "http://127.0.0.1:5005/vidaextra-8db27/us-central1",
  "http://localhost:5999/vidaextra-8db27/us-central1",
  "http://127.0.0.1:5999/vidaextra-8db27/us-central1",
];
const PROD_BASE = "https://us-central1-vidaextra-8db27.cloudfunctions.net";

let cachedBase = null;

async function probeLocal() {
  for (const base of LOCAL_BASES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 700);
    try {
      const res = await fetch(`${base}/ping`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        // keep CORS mode so 404/no-cors returns as failure, avoiding false positives
        mode: "cors",
      });
      clearTimeout(timeout);
      if (res && res.ok) {
        // optional: ensure body says ok
        const text = await res.text().catch(() => "");
        if (text && text.toLowerCase().includes("ok")) return base;
      }
    } catch {
      clearTimeout(timeout);
    }
  }
  return null;
}

export async function getApiBase() {
  if (cachedBase) return cachedBase;
  // Prefer local emulator only when running on localhost and it's reachable
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    const local = await probeLocal();
    if (local) {
      cachedBase = local;
    } else {
      // Use a same-origin proxy during local dev to avoid CORS
      cachedBase = "/api";
    }
  } else {
    cachedBase = PROD_BASE;
  }
  return cachedBase || PROD_BASE;
}

export async function apiFetch(path, options = {}) {
  const base = await getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    // Default CORS mode for local dev, headers merged after
    mode: "cors",
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
}

export const API_ENDPOINTS = { LOCAL_BASES, PROD_BASE };
