/** «[1]» / «[12]» — счётчик в toolbar каталога. */
export function formatCatalogProductCount(n: number): string {
  return `[${Math.floor(n).toLocaleString('ru-RU')}]`;
}
