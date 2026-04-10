/**
 * Общие типы для фронта (соответствуют API и Prisma-моделям).
 */

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type OrderStatus = 'ORDERED' | 'PAID' | 'RECEIVED';
export type RewardStatus = 'PENDING' | 'INVOICED' | 'PAID';
export type PageType = 'ABOUT' | 'SERVICES' | 'DELIVERY' | 'PAYMENT' | 'CONTACTS' | 'CUSTOM';
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  legalType?: string | null;
  companyName?: string | null;
  inn?: string | null;
  kycStatus?: KycStatus | null;
  kycData?: Record<string, unknown> | null;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  siteUrl?: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  categoryId: string;
  category?: Category;
  brandId?: string | null;
  brand?: Brand | null;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Collection {
  id: string;
  title: string;
  shareToken?: string | null;
  items: CollectionItem[];
}

export interface CollectionItem {
  product: Product;
}

export interface Designer {
  id: string;
  slug: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
}

export interface Favorite {
  productVariantId: string;
  productVariant: { product: Product };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export interface PublicCollection {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  items?: { product: Product }[];
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  body: string;
  type: PageType;
}
