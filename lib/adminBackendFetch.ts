/** Прокси к Nest под тем же origin; JWT берётся из httpOnly-cookie на сервере маршрута. */
export function adminBackendPath(apiPath: string): string {
  const clean = apiPath.replace(/^\/+/, '');
  return `/api/admin/backend/${clean}`;
}

export async function adminBackendFetch(apiPath: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(adminBackendPath(apiPath), {
    credentials: 'same-origin',
    ...init,
    headers,
  });
}

export async function adminUploadCategoryImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(adminBackendPath('catalog/admin/upload-image'), {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      if (typeof j?.message === 'string') msg = j.message;
      else if (Array.isArray(j?.message)) msg = j.message.join(', ');
    } catch {
      try {
        msg = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ url: string }>;
}

export async function adminBackendJson<T>(apiPath: string, init?: RequestInit): Promise<T> {
  const res = await adminBackendFetch(apiPath, init);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      if (typeof j?.message === 'string') msg = j.message;
      else if (Array.isArray(j?.message)) msg = j.message.join(', ');
    } catch {
      try {
        msg = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Сброс кэша публичного каталога на Next после мутаций в админке (см. `catalogCache.ts`). */
export async function revalidatePublicCatalogCache(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/revalidate-catalog', {
      method: 'POST',
      credentials: 'same-origin',
    });
    return res.ok;
  } catch {
    return false;
  }
}
