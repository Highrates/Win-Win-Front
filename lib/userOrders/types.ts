export type UserOrderListItemApi = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  createdAt: string;
  items: {
    quantity: number;
    snapshot?: unknown;
    product: {
      name: string;
      slug: string;
      images?: { url: string }[];
    };
  }[];
};

export type UserOrdersListResponse = {
  items: UserOrderListItemApi[];
  total: number;
  page: number;
  limit: number;
};

export type UserOrderDetailItemApi = {
  id: string;
  quantity: number;
  unit: string;
  price: string | number;
  snapshot?: unknown;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
    brand?: { name: string } | null;
  };
};

export type UserOrderDetailApi = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  comment: string | null;
  customerName: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items: UserOrderDetailItemApi[];
};
