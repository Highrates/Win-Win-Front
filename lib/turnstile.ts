/** Cloudflare Turnstile site key (auth + Product QA). */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_PRODUCT_QA_TURNSTILE_SITE_KEY?.trim() ||
  '';

export function isTurnstileRequired(): boolean {
  return Boolean(TURNSTILE_SITE_KEY);
}
