/** scrollIntoView с учётом prefers-reduced-motion. */
export function scrollElementIntoView(
  el: Element | null | undefined,
  options?: Omit<ScrollIntoViewOptions, 'behavior'> & { behavior?: ScrollBehavior },
): void {
  if (!el) return;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduced ? 'auto' : (options?.behavior ?? 'smooth');
  el.scrollIntoView({ block: 'start', ...options, behavior });
}
