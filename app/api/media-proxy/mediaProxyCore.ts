import { getServerApiBase, normalizeApiV1Base } from '@/lib/serverApiBase';
import {
  fetchMediaWithAllowedRedirects as fetchMediaWithAllowedRedirectsCore,
  isAllowedMediaProxyTarget as isAllowedMediaProxyTargetCore,
  MediaProxyRedirectDeniedError,
  MediaProxyTooManyRedirectsError,
  MEDIA_PROXY_MAX_REDIRECTS,
  originFromApiBase,
  parseAllowedHostSuffixesFromEnv,
  resolveMediaProxyTargetUrl as resolveMediaProxyTargetUrlCore,
  type MediaProxyAllowlistConfig,
} from '@win-win/media-proxy-allowlist';

export {
  MediaProxyRedirectDeniedError,
  MediaProxyTooManyRedirectsError,
  MEDIA_PROXY_MAX_REDIRECTS,
};

function collectAllowedOrigins(): Set<string> {
  const out = new Set<string>();
  const candidates = [
    process.env.API_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.NEXT_PUBLIC_API_URL,
    getServerApiBase(),
  ];
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const origin = originFromApiBase(normalizeApiV1Base(raw.trim()));
    if (origin) out.add(origin);
  }
  out.add('http://127.0.0.1:3001');
  out.add('http://localhost:3001');
  return out;
}

function allowlistConfig(): MediaProxyAllowlistConfig {
  return {
    allowedOrigins: collectAllowedOrigins(),
    extraHostSuffixes: parseAllowedHostSuffixesFromEnv(
      process.env.MEDIA_PROXY_ALLOWED_HOST_SUFFIXES,
    ),
  };
}

export function isAllowedMediaProxyTarget(target: URL): boolean {
  return isAllowedMediaProxyTargetCore(target, allowlistConfig());
}

export function resolveMediaProxyTargetUrl(raw: string): URL | null {
  const origin = originFromApiBase(normalizeApiV1Base(getServerApiBase()));
  return resolveMediaProxyTargetUrlCore(raw, origin);
}

export async function fetchMediaWithAllowedRedirects(
  start: URL,
  init?: Omit<RequestInit, 'redirect'>,
  opts?: { maxRedirects?: number; fetchImpl?: typeof fetch },
): Promise<Response> {
  return fetchMediaWithAllowedRedirectsCore(start, allowlistConfig(), init, opts);
}
