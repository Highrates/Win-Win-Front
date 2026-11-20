import type { RichBlockStrings } from "@/lib/richBlockI18n";
import { richBlockStrings } from "@/lib/richBlockI18n";

/**
 * Нормализация URL для mark link в RichBlock.
 * Допускает http(s) и относительные пути `/…` (не protocol-relative `//`).
 */
export function normalizeRichLinkUrl(
  raw: string,
  strings: Pick<
    RichBlockStrings,
    "linkErrEmpty" | "linkErrProtocol" | "linkErrInvalid"
  > = richBlockStrings("ru"),
): { ok: true; href: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) {
    return { ok: false, error: strings.linkErrEmpty };
  }
  if (t.startsWith("//")) {
    return { ok: false, error: strings.linkErrProtocol };
  }
  if (t.startsWith("/")) {
    return { ok: true, href: t };
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: strings.linkErrProtocol };
    }
    return { ok: true, href: u.toString() };
  } catch {
    try {
      const u = new URL(`https://${t}`);
      if (!u.hostname.includes(".")) {
        return { ok: false, error: strings.linkErrInvalid };
      }
      return { ok: true, href: u.toString() };
    } catch {
      return { ok: false, error: strings.linkErrInvalid };
    }
  }
}
