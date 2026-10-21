/**
 * DEV-only: кто дергает chatty account/nav API.
 *
 * В консоли:
 *   __wwInspectNet.enable()
 *   __wwInspectNet.disable()
 *   __wwInspectNet.dump()
 *   __wwInspectNet.clear()
 *
 * Или: localStorage.wwInspectNet = '1' и reload / ?inspectNet=1
 */

const STORAGE_KEY = 'wwInspectNet';

const WATCH =
  /\/api\/(?:user\/order-chat\/me\/unread-count|user\/orders|user\/sourcing-requests|brands\/menu|catalog\/roots)/;

const EVENTS = [
  'winwin:account-work-feed-refresh',
  'winwin:account-work-notifications',
] as const;

type Hit = {
  t: number;
  kind: 'fetch' | 'event';
  label: string;
  stack?: string;
};

type Api = {
  enabled: boolean;
  hits: Hit[];
  enable: () => void;
  disable: () => void;
  clear: () => void;
  dump: () => void;
};

declare global {
  interface Window {
    __wwInspectNet?: Api;
  }
}

function shortStack(stack?: string): string {
  if (!stack) return '';
  return stack
    .split('\n')
    .slice(2, 8)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ← ');
}

function pathOf(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.pathname + input.search;
    return input.url;
  } catch {
    return String(input);
  }
}

function normalizeLabel(raw: string): string {
  try {
    const u = raw.startsWith('http') ? new URL(raw) : new URL(raw, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return raw;
  }
}

export function installInspectNet(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;
  if (window.__wwInspectNet) return;

  const hits: Hit[] = [];
  let patched = false;
  let origFetch: typeof window.fetch | null = null;
  const unsubs: Array<() => void> = [];

  const api: Api = {
    enabled: false,
    hits,
    enable() {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
      api.enabled = true;
      patch();
      // eslint-disable-next-line no-console
      console.info('[wwInspectNet] ON — смотрим unread / orders / sourcing / brands / catalog + work events');
    },
    disable() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      api.enabled = false;
      unpatch();
      // eslint-disable-next-line no-console
      console.info('[wwInspectNet] OFF');
    },
    clear() {
      hits.length = 0;
      // eslint-disable-next-line no-console
      console.info('[wwInspectNet] cleared');
    },
    dump() {
      const byLabel = new Map<string, number>();
      for (const h of hits) {
        byLabel.set(h.label, (byLabel.get(h.label) ?? 0) + 1);
      }
      const summary = Array.from(byLabel.entries()).sort((a, b) => b[1] - a[1]);
      // eslint-disable-next-line no-console
      console.table(summary.map(([label, count]) => ({ label, count })));
      // eslint-disable-next-line no-console
      console.table(
        hits.slice(-40).map((h) => ({
          ms: h.t,
          kind: h.kind,
          label: h.label,
          stack: h.stack?.slice(0, 160) ?? '',
        })),
      );
    },
  };

  function record(kind: Hit['kind'], label: string) {
    if (!api.enabled) return;
    const hit: Hit = {
      t: performance.now(),
      kind,
      label,
      stack: shortStack(new Error().stack),
    };
    hits.push(hit);
    if (hits.length > 400) hits.splice(0, hits.length - 400);
    // eslint-disable-next-line no-console
    console.log(
      `%c[wwInspectNet] ${kind}`,
      kind === 'event' ? 'color:#c45c26' : 'color:#2a6f97',
      label,
      hit.stack ? `\n  ${hit.stack}` : '',
    );
  }

  function patch() {
    if (patched) return;
    patched = true;
    origFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const raw = pathOf(input);
      const label = normalizeLabel(raw);
      if (WATCH.test(label)) record('fetch', label);
      return origFetch!(input, init);
    }) as typeof window.fetch;

    for (const name of EVENTS) {
      const handler = () => record('event', name);
      window.addEventListener(name, handler);
      unsubs.push(() => window.removeEventListener(name, handler));
    }
  }

  function unpatch() {
    if (!patched) return;
    patched = false;
    if (origFetch) window.fetch = origFetch;
    origFetch = null;
    while (unsubs.length) unsubs.pop()?.();
  }

  window.__wwInspectNet = api;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('inspectNet') === '1') {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      api.enable();
    }
  } catch {
    /* ignore */
  }
}
