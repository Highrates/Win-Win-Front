import { BLOG_CATEGORIES } from './blogCategories';
import type { BlogPostCategory } from './blogCategories';

export type BlogRichSection = {
  title: string;
  text: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  category: BlogPostCategory;
  /** Рубрики для чипов на странице статьи; по умолчанию — только `category`. */
  articleCategories?: BlogPostCategory[];
  date: string;
  excerpt: string;
  /** Обложка под заголовком статьи */
  coverSrc?: string;
  coverAlt?: string;
  /** Текст над блоком с секциями (как richContentLead в модалке дизайнера) */
  richIntro?: string;
  richSections?: BlogRichSection[];
};

/** id рубрик для отображения на странице статьи */
export function getArticleCategoryIds(post: BlogPost): BlogPostCategory[] {
  return post.articleCategories?.length ? post.articleCategories : [post.category];
}

export function getCategoryLabel(id: BlogPostCategory): string {
  const row = BLOG_CATEGORIES.find((c) => c.id === id);
  return row?.label ?? id;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'novaya-kollekciya',
    title: 'Новая коллекция мебели 2025 года уже в каталоге',
    category: 'events',
    articleCategories: ['events', 'brands'],
    date: '15 января 2025',
    excerpt:
      'Обзор ключевых линий и материалов новой коллекции: что вошло в каталог и как это использовать в проектах.',
    richIntro:
      'В каталоге появились новые линии мебели и отделки — ниже кратко, что важно дизайнерам при подборе.',
    richSections: [
      {
        title: 'Коллекции',
        text: 'Акцент на модульность и натуральные материалы: дерево, текстиль и металлические детали в одной палитре.',
      },
      {
        title: 'Как использовать в проектах',
        text: 'Серии совместимы между собой по габаритам и фактурам — удобно собирать единый образ без долгой сверки артикулов.',
      },
    ],
  },
  {
    slug: 'trendy-interera',
    title: 'Тренды интерьера: что останется в моде',
    category: 'guides',
    date: '10 января 2025',
    excerpt: 'Кратко о тенденциях сезона — цвет, фактуры и планировки, которые не устареют через год.',
  },
  {
    slug: 'sovety-dizajneram',
    title: 'Советы начинающим дизайнерам',
    category: 'interviews',
    date: '5 января 2025',
    excerpt: 'Практические шаги: портфолио, коммуникация с клиентом и работа с подрядчиками.',
  },
  {
    slug: 'brend-istoriya',
    title: 'История бренда: от мастерской до шоурума',
    category: 'brands',
    date: '1 января 2025',
    excerpt: 'Как развивался бренд и какие ценности легли в основу текущей коллекции.',
    richIntro:
      'Путь от небольшой мастерской до флагманского шоурума — в ключевых вехах и принципах, которые сохранились в бренде.',
    richSections: [
      {
        title: 'Ценности',
        text: 'Качество изготовления, прозрачные сроки и поддержка дизайнеров на этапе комплектации остаются в основе работы с клиентами.',
      },
      {
        title: 'Сегодня',
        text: 'Ассортимент расширяется, но визуальный язык и отношение к деталям выдерживаются во всех линиях.',
      },
    ],
  },
  {
    slug: 'vystavka-moskva',
    title: 'События сезона: выставка в Москве',
    category: 'events',
    date: '28 декабря 2024',
    excerpt: 'Главные стенды и новинки выставки — что посмотреть дизайнеру интерьеров.',
  },
  {
    slug: 'materialy-gid',
    title: 'Гид по отделочным материалам',
    category: 'guides',
    date: '20 декабря 2024',
    excerpt: 'С чего начать подбор материалов и на что обратить внимание в технических паспортах.',
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
