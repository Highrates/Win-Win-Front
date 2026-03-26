import type { OrderProduct } from './types';

export const ORDER_TABS = ['Подготовка заказа', 'В работе', 'Завершенные'] as const;

export const ORDER_PRODUCTS: OrderProduct[] = [
  {
    id: '1',
    name: 'Кресло Otto Soft',
    price: '~ 185 990',
    color: 'Светло-серый',
    material: 'Массив дуба, текстиль',
    size: '82 × 76 × 90 см',
  },
  {
    id: '2',
    name: 'Диван Bergen',
    price: '~ 412 500',
    color: 'Тёмно-синий',
    material: 'Велюр, дерево',
    size: '240 × 95 × 85 см',
  },
  {
    id: '3',
    name: 'Стол обеденный Nord',
    price: '~ 89 900',
    color: 'Натуральный дуб',
    material: 'Массив дуба',
    size: '180 × 90 × 75 см',
  },
];
