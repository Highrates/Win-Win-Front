import type {
  DesignerProjectDetailApi,
  DesignerProjectListResponse,
  SaveDesignerProjectPayload,
} from './apiTypes';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
}

export async function fetchDesignerProjectList(): Promise<DesignerProjectListResponse> {
  const res = await fetch('/api/user/designer-projects', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<DesignerProjectListResponse>(res);
}

export async function fetchDesignerProjectDetail(id: string): Promise<DesignerProjectDetailApi> {
  const res = await fetch(`/api/user/designer-projects/${encodeURIComponent(id)}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<DesignerProjectDetailApi>(res);
}

export async function createDesignerProject(body: SaveDesignerProjectPayload): Promise<DesignerProjectDetailApi> {
  const res = await fetch('/api/user/designer-projects', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<DesignerProjectDetailApi>(res);
}

export async function updateDesignerProject(
  id: string,
  body: SaveDesignerProjectPayload,
): Promise<DesignerProjectDetailApi> {
  const res = await fetch(`/api/user/designer-projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<DesignerProjectDetailApi>(res);
}

export async function deleteDesignerProjectApi(id: string): Promise<void> {
  const res = await fetch(`/api/user/designer-projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
}
