export type PublicDesigner = {
  slug: string;
  name: string;
  services: string;
  city: string;
  collections: number;
  likes: number;
};

export const DESIGNERS: PublicDesigner[] = [
  {
    slug: 'anna-ivanova',
    name: 'Анна Иванова',
    services: 'Проектирование, Комплектация, Подбор мебели, Авторский надзор, Декорирование',
    city: 'г. Москва',
    collections: 12,
    likes: 89,
  },
  {
    slug: 'boris-petrov',
    name: 'Борис Петров',
    services: 'Проектирование, Подбор мебели, Декорирование',
    city: 'г. Москва',
    collections: 8,
    likes: 156,
  },
  {
    slug: 'maria-sidorova',
    name: 'Мария Сидорова',
    services: 'Комплектация, Авторский надзор',
    city: 'г. Санкт-Петербург',
    collections: 24,
    likes: 203,
  },
  {
    slug: 'dmitry-kozlov',
    name: 'Дмитрий Козлов',
    services: 'Проектирование, Комплектация, Подбор мебели, Декорирование',
    city: 'г. Москва',
    collections: 5,
    likes: 67,
  },
  {
    slug: 'elena-novikova',
    name: 'Елена Новикова',
    services: 'Проектирование, Авторский надзор, Декорирование',
    city: 'г. Москва',
    collections: 18,
    likes: 312,
  },
  {
    slug: 'sergey-volkov',
    name: 'Сергей Волков',
    services: 'Подбор мебели, Комплектация',
    city: 'г. Москва',
    collections: 9,
    likes: 98,
  },
  {
    slug: 'olga-kuznetsova',
    name: 'Ольга Кузнецова',
    services: 'Проектирование, Комплектация, Подбор мебели, Авторский надзор, Декорирование',
    city: 'г. Москва',
    collections: 15,
    likes: 124,
  },
  {
    slug: 'andrey-sokolov',
    name: 'Андрей Соколов',
    services: 'Проектирование, Декорирование',
    city: 'г. Казань',
    collections: 7,
    likes: 76,
  },
];

const DESIGNERS_BY_SLUG = new Map(DESIGNERS.map((designer) => [designer.slug, designer]));

export function getDesignerBySlug(slug: string): PublicDesigner {
  const designer = DESIGNERS_BY_SLUG.get(slug);
  if (designer) return designer;

  const fallbackName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    slug,
    name: fallbackName,
    city: 'г. Москва',
    services: '',
    collections: 0,
    likes: 0,
  };
}
