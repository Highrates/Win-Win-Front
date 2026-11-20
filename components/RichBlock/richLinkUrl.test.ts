import { describe, expect, it } from "vitest";
import { normalizeRichLinkUrl } from "./richLinkUrl";

describe("normalizeRichLinkUrl", () => {
  it("accepts https and relative paths", () => {
    expect(normalizeRichLinkUrl("https://example.com/a")).toEqual({
      ok: true,
      href: "https://example.com/a",
    });
    expect(normalizeRichLinkUrl("/account/profile")).toEqual({
      ok: true,
      href: "/account/profile",
    });
  });

  it("rejects empty, javascript:, and protocol-relative", () => {
    expect(normalizeRichLinkUrl("").ok).toBe(false);
    expect(normalizeRichLinkUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeRichLinkUrl("//evil.test").ok).toBe(false);
  });

  it("prefixes bare domains with https", () => {
    const r = normalizeRichLinkUrl("example.com/x");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.href).toBe("https://example.com/x");
  });
});
