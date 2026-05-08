import type { OrderProduct } from './types';

export const ORDER_TABS = ['Подготовка заказа', 'В работе', 'Завершенные'] as const;

export const ORDER_PRODUCTS: OrderProduct[] = [
  {
    id: '1',
    name: 'Кресло Otto Soft',
    price: '~ 185 990 ₽',
    metaRows: [
      { label: 'Цвет', value: 'Светло-серый' },
      { label: 'Материал', value: 'Массив дуба, текстиль' },
      { label: 'Размер', value: '82 × 76 × 90 см' },
    ],
  },
  {
    id: '2',
    name: 'Диван Bergen',
    price: '~ 412 500 ₽',
    metaRows: [
      { label: 'Цвет', value: 'Тёмно-синий' },
      { label: 'Материал', value: 'Велюр, дерево' },
      { label: 'Размер', value: '240 × 95 × 85 см' },
    ],
  },
  {
    id: '3',
    name: 'Стол обеденный Nord',
    price: '~ 89 900 ₽',
    metaRows: [
      { label: 'Цвет', value: 'Натуральный дуб' },
      { label: 'Материал', value: 'Массив дуба' },
      { label: 'Размер', value: '180 × 90 × 75 см' },
    ],
  },
];
