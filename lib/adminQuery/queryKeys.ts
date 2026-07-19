export const adminQueryKeys = {
  products: {
    all: ['admin', 'catalog', 'products'] as const,
    list: (params: {
      q: string;
      page: number;
      visibility?: string;
      brandId?: string;
      categoryId?: string;
      tagId?: string;
      collectionId?: string;
      productSetId?: string;
    }) => ['admin', 'catalog', 'products', 'list', params] as const,
  },
  categories: {
    all: ['admin', 'catalog', 'categories'] as const,
    /** Без q — полный список для DnD (page не участвует в запросе и ключе). */
    list: (params: { q: string; page?: number }) =>
      params.q
        ? (['admin', 'catalog', 'categories', 'list', { q: params.q, page: params.page ?? 1 }] as const)
        : (['admin', 'catalog', 'categories', 'list', { q: '' }] as const),
  },
  brands: {
    all: ['admin', 'catalog', 'brands'] as const,
    list: (params: { q: string; page: number }) =>
      ['admin', 'catalog', 'brands', 'list', params] as const,
  },
  collections: {
    all: ['admin', 'collections'] as const,
    /** Без q — полный список для DnD (page не участвует в запросе и ключе). */
    list: (params: { q: string; page?: number }) =>
      params.q
        ? (['admin', 'collections', 'list', { q: params.q, page: params.page ?? 1 }] as const)
        : (['admin', 'collections', 'list', { q: '' }] as const),
  },
  catalogTags: {
    all: ['admin', 'catalog', 'tags'] as const,
    /** Без q — полный список для DnD (page не участвует в запросе и ключе). */
    list: (params: { q: string; page?: number }) =>
      params.q
        ? (['admin', 'catalog', 'tags', 'list', { q: params.q, page: params.page ?? 1 }] as const)
        : (['admin', 'catalog', 'tags', 'list', { q: '' }] as const),
  },
  productSets: {
    all: ['admin', 'product-sets'] as const,
    list: (params: { q: string; page: number }) =>
      ['admin', 'product-sets', 'list', params] as const,
  },
  clients: {
    all: ['admin', 'clients'] as const,
    list: (params: { q: string; page: number }) => ['admin', 'clients', 'list', params] as const,
  },
  orders: {
    all: ['admin', 'orders'] as const,
    list: (params: { page: number; q: string; bucket: string; userId?: string }) =>
      ['admin', 'orders', 'list', params] as const,
  },
  sourcingRequests: {
    all: ['admin', 'sourcing-requests'] as const,
    list: (params: { page: number; q: string; bucket: string }) =>
      ['admin', 'sourcing-requests', 'list', params] as const,
  },
  blog: {
    all: ['admin', 'blog'] as const,
    categories: ['admin', 'blog', 'categories'] as const,
    posts: (params: { q: string; categoryId: string; page: number; filtered: boolean }) =>
      ['admin', 'blog', 'posts', params] as const,
  },
  applications: {
    all: ['admin', 'applications'] as const,
    partnerList: (page: number) => ['admin', 'applications', 'partner-list', { page }] as const,
  },
  designerProjects: {
    all: ['admin', 'designer-projects'] as const,
    list: (params: { page: number; q: string; userId?: string }) =>
      ['admin', 'designer-projects', 'list', params] as const,
  },
  referrals: {
    all: ['admin', 'referrals'] as const,
    profiles: ['admin', 'referrals', 'profiles'] as const,
  },
  mediaObjects: {
    all: ['admin', 'media', 'objects'] as const,
    list: (params: {
      q: string;
      page: number;
      tab: string;
      folderId: string | null;
      scope: string;
    }) => ['admin', 'media', 'objects', 'list', params] as const,
  },
  mediaFolders: {
    all: ['admin', 'media', 'folders'] as const,
    list: (scope: string) => ['admin', 'media', 'folders', 'list', { scope }] as const,
  },
} as const;
