// Centralized API Client & VPS Endpoint Resolver
// Supports Vercel Frontend -> VPS Backend architecture

const STORAGE_KEY_VPS_URL = "bot_host_vps_api_url";
const STORAGE_KEY_VPS_SECRET = "bot_host_vps_api_secret";

/**
 * Get configured VPS API Base URL
 * Priority: localStorage > import.meta.env.VITE_VPS_API_URL > "" (relative /api)
 */
export function getVpsApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(STORAGE_KEY_VPS_URL);
    if (custom && custom.trim().length > 0) {
      return custom.trim().replace(/\/+$/, "");
    }
  }

  // Check Vite environment variable (injected at Vercel build time)
  const envUrl = (import.meta as any).env?.VITE_VPS_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  return "";
}

/**
 * Get configured VPS API Secret Key
 */
export function getVpsApiSecret(): string {
  if (typeof window !== "undefined") {
    const secret = localStorage.getItem(STORAGE_KEY_VPS_SECRET);
    if (secret && secret.trim().length > 0) {
      return secret.trim();
    }
  }

  const envSecret = (import.meta as any).env?.VITE_VPS_API_SECRET;
  if (envSecret && typeof envSecret === "string") {
    return envSecret.trim();
  }

  return "";
}

/**
 * Save custom VPS configuration
 */
export function saveVpsConfig(url: string, secret?: string) {
  if (typeof window !== "undefined") {
    if (url && url.trim().length > 0) {
      localStorage.setItem(STORAGE_KEY_VPS_URL, url.trim().replace(/\/+$/, ""));
    } else {
      localStorage.removeItem(STORAGE_KEY_VPS_URL);
    }

    if (secret !== undefined) {
      if (secret.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY_VPS_SECRET, secret.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_VPS_SECRET);
      }
    }
  }
}

/**
 * Resolve full API endpoint URL
 * e.g. "/api/servers" -> "http://194.163.148.91:3000/api/servers" (or relative "/api/servers")
 */
export function resolveApiUrl(path: string): string {
  const base = getVpsApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    return normalizedPath;
  }

  // If base already contains /api and path starts with /api, prevent duplicate
  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.substring(4)}`;
  }

  return `${base}${normalizedPath}`;
}

/**
 * Standard fetch wrapper that automatically routes to VPS API and appends auth headers
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = resolveApiUrl(path);
  const secret = getVpsApiSecret();

  const headers = new Headers(options.headers || {});
  if (secret && !headers.has("x-vps-api-secret") && !headers.has("Authorization")) {
    headers.set("x-vps-api-secret", secret);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
