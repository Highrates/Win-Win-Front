import { normalizeSearchText } from './searchNormalize';

export type HighlightPart = { text: string; mark: boolean };

/** Подсветка вхождения query в title (case/ё-insensitive). */
export function highlightSearchTitle(title: string, query: string): HighlightPart[] {
  const q = query.trim();
  if (!q || !title) return [{ text: title, mark: false }];

  const normTitle = normalizeSearchText(title);
  const normQ = normalizeSearchText(q);
  if (!normQ) return [{ text: title, mark: false }];

  const idx = normTitle.indexOf(normQ);
  if (idx < 0) {
    /* try first token */
    const token = normQ.split(/\s+/).filter(Boolean)[0];
    if (!token || token === normQ) return [{ text: title, mark: false }];
    const tIdx = normTitle.indexOf(token);
    if (tIdx < 0) return [{ text: title, mark: false }];
    return splitAt(title, tIdx, token.length);
  }
  return splitAt(title, idx, normQ.length);
}

function splitAt(title: string, start: number, len: number): HighlightPart[] {
  const before = title.slice(0, start);
  const mid = title.slice(start, start + len);
  const after = title.slice(start + len);
  const parts: HighlightPart[] = [];
  if (before) parts.push({ text: before, mark: false });
  if (mid) parts.push({ text: mid, mark: true });
  if (after) parts.push({ text: after, mark: false });
  return parts.length ? parts : [{ text: title, mark: false }];
}
