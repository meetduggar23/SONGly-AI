import axios from "axios";
import { API } from "@/constants";

/**
 * Configured Axios instances for each external API.
 *
 * Requests always travel through a single-layer proxy that forwards the
 * complete target URL (including its query params) inside a `url` parameter:
 * - In development, requests hit Vite's built-in `/api-proxy` middleware
 *   (see vite.config.ts), so no third-party proxy is needed.
 * - In production builds, requests go through an external CORS proxy, which
 *   can be swapped via VITE_API_PROXY (defaults to corsproxy.io).
 */

const proxyBase =
  import.meta.env.VITE_API_PROXY?.replace(/\/+$/, "") ||
  "https://corsproxy.io";

const PROXY_URL = import.meta.env.DEV
  ? "/api-proxy?url="
  : `${proxyBase}/?url=`;

interface ProxiedClientOptions {
  baseURL: string;
  timeout: number;
  params?: Record<string, string | number | undefined>;
}

/**
 * Create an axios client that wraps requests through the CORS proxy.
 * The upstream URL is assembled from the *real* API base first, then the whole
 * thing (query params included) is encoded into the proxy's `url` parameter.
 */
function createProxiedClient({ baseURL, timeout, params }: ProxiedClientOptions) {
  const client = axios.create({
    timeout,
    params,
    headers: { Accept: "application/json" },
  });

  client.interceptors.request.use((config) => {
    const base = baseURL.replace(/\/+$/, "");
    const path = (config.url || "").replace(/^\/+/, "");
    const target = new URL(path, `${base}/`);
    const mergedParams = config.params as Record<string, unknown> | undefined;
    config.params = undefined;
    if (mergedParams) {
      for (const [key, value] of Object.entries(mergedParams)) {
        if (value !== undefined && value !== null && value !== "") {
          target.searchParams.set(key, String(value));
        }
      }
    }
    config.url = `${PROXY_URL}${encodeURIComponent(target.toString())}`;
    return config;
  });

  return client;
}

export const deezerClient = createProxiedClient({
  baseURL: API.deezer,
  timeout: 15000,
});

export const ovhClient = createProxiedClient({
  baseURL: API.ovh,
  timeout: 15000,
});

export const lrcLibClient = createProxiedClient({
  baseURL: API.lrcLib,
  timeout: 15000,
});

export const itunesClient = createProxiedClient({
  baseURL: API.itunes,
  timeout: 15000,
});

export const lastfmClient = createProxiedClient({
  baseURL: API.lastfm,
  timeout: 15000,
  params: {
    api_key: import.meta.env.VITE_LASTFM_API_KEY || "",
    format: "json",
  },
});

// Global error interceptor
const errorInterceptor = (error: unknown) => {
  return Promise.reject(error);
};

deezerClient.interceptors.response.use((r) => r, errorInterceptor);
ovhClient.interceptors.response.use((r) => r, errorInterceptor);
lrcLibClient.interceptors.response.use((r) => r, errorInterceptor);
itunesClient.interceptors.response.use((r) => r, errorInterceptor);
lastfmClient.interceptors.response.use((r) => r, errorInterceptor);
