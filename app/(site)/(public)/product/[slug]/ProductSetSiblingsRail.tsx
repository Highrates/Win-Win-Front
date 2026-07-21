import { Recommendations } from '@/sections/home';
import { loadProductSetSiblings } from '@/lib/product/loadProductPageData';
import { mapSetSiblingCards } from '@/lib/product/mapProductPageView';

type Props = {
  slug: string;
};

export async function ProductSetSiblingsRail({ slug }: Props) {
  const setSiblings = await loadProductSetSiblings(slug);
  const items = mapSetSiblingCards(setSiblings);
  if (!items.length) return null;

  return (
    <Recommendations id="product-recommendations" title="Наборы" items={items} />
  );
}
