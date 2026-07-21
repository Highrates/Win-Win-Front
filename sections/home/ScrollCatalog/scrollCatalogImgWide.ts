/** Карточки каталога с широким imgWrap (кроме ритма index 0/3). */
const WIDE_STRIP_SLUGS = new Set(['myagkaya-mebel-ulichnye']);

export function isScrollCatalogImgWide(slug: string, index: number): boolean {
  return index === 0 || index === 3 || WIDE_STRIP_SLUGS.has(slug);
}
