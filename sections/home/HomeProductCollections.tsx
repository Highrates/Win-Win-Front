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
          key={section.allHref ?? section.title}
          title={section.title}
          items={section.items}
          allHref={section.allHref}
          advanceGalleryOnScroll={section.advanceGalleryOnScroll}
          progressiveLoad={section.progressiveLoad}
        />
      ))}
    </>
  );
}
