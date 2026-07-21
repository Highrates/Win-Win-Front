import { Recommendations } from './Recommendations/Recommendations';
import type { HomeProductRailSection } from '@/lib/home/mapHomeSections';

type Props = {
  sections: HomeProductRailSection[];
};

export function HomeProductCollections({ sections }: Props) {
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => (
        <Recommendations
          key={section.title}
          title={section.title}
          items={section.items}
          advanceGalleryOnScroll={section.advanceGalleryOnScroll}
          progressiveLoad={section.progressiveLoad}
        />
      ))}
    </>
  );
}
