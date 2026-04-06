export type AdminBlogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  postCount: number;
};

export type AdminBlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
};

export type AdminBlogPostDetail = AdminBlogPostListItem & {
  body: string;
  coverUrl: string | null;
  categoryId: string | null;
  authorId: string | null;
};

export type AdminBlogPostsListResponse = {
  items: AdminBlogPostListItem[];
  total: number;
  page: number;
  limit: number;
};
