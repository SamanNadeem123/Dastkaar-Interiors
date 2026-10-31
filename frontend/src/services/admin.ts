import api from "./api";
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductImage,
  Category,
  Order,
  User,
  DeliveryZone,
  Review,
  GalleryImage,
  StoreSettings,
  DashboardStats,
  AdminNotification,
} from "../types";

export interface ProductAdminFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  status?: "active" | "inactive";
  availability?: string;
  sort?: string;
}

export interface ProductPayload {
  name: string;
  category_id: number;
  sku?: string;
  short_description?: string;
  description?: string;
  original_price: number;
  sale_price?: number | null;
  material?: string;
  wood_type?: string;
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  weight?: number;
  dimension_unit?: string;
  availability?: string;
  stock_quantity?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_on_sale?: boolean;
  is_active?: boolean;
  colors?: { color_name: string; color_code?: string }[];
}

export const adminProductsApi = {
  list: (filters: ProductAdminFilters = {}) =>
    api.get<ApiResponse<PaginatedResponse<Product>>>("/admin/products", { params: filters }).then((r) => r.data.data),

  get: (id: number) => api.get<ApiResponse<{ product: Product }>>(`/admin/products/${id}`).then((r) => r.data.data.product),

  create: (payload: ProductPayload) =>
    api.post<ApiResponse<{ product: Product }>>("/admin/products", payload).then((r) => r.data.data.product),

  update: (id: number, payload: Partial<ProductPayload>) =>
    api.put<ApiResponse<{ product: Product }>>(`/admin/products/${id}`, payload).then((r) => r.data.data.product),

  archive: (id: number) => api.delete<ApiResponse<Record<string, never>>>(`/admin/products/${id}`),

  restore: (id: number) =>
    api.post<ApiResponse<{ product: Product }>>(`/admin/products/${id}/restore`).then((r) => r.data.data.product),

  uploadImages: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    return api
      .post<ApiResponse<{ images: ProductImage[] }>>(`/admin/products/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data.images);
  },

  deleteImage: (productId: number, imageId: number) =>
    api.delete<ApiResponse<Record<string, never>>>(`/admin/products/${productId}/images/${imageId}`),

  setPrimaryImage: (productId: number, imageId: number) =>
    api.put<ApiResponse<Record<string, never>>>(`/admin/products/${productId}/images/${imageId}/primary`),

  reorderImages: (productId: number, order: number[]) =>
    api.put<ApiResponse<{ images: ProductImage[] }>>(`/admin/products/${productId}/images/reorder`, { order }),
};

export const adminCategoriesApi = {
  list: () => api.get<ApiResponse<{ items: Category[] }>>("/admin/categories").then((r) => r.data.data.items),

  create: (payload: { name: string; description?: string; is_active?: boolean }) =>
    api.post<ApiResponse<{ category: Category }>>("/admin/categories", payload).then((r) => r.data.data.category),

  update: (id: number, payload: Partial<{ name: string; description: string; is_active: boolean; sort_order: number }>) =>
    api.put<ApiResponse<{ category: Category }>>(`/admin/categories/${id}`, payload).then((r) => r.data.data.category),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api
      .post<ApiResponse<{ category: Category }>>(`/admin/categories/${id}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data.category);
  },

  remove: (id: number) => api.delete<ApiResponse<{ category?: Category }>>(`/admin/categories/${id}`),
};

export interface OrderAdminFilters {
  page?: number;
  limit?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export const adminOrdersApi = {
  list: (filters: OrderAdminFilters = {}) =>
    api.get<ApiResponse<PaginatedResponse<Order>>>("/admin/orders", { params: filters }).then((r) => r.data.data),

  get: (id: number) => api.get<ApiResponse<{ order: Order }>>(`/admin/orders/${id}`).then((r) => r.data.data.order),

  updateStatus: (id: number, order_status: string) =>
    api.patch<ApiResponse<{ order: Order }>>(`/admin/orders/${id}/status`, { order_status }).then((r) => r.data.data.order),
};

export const adminCustomersApi = {
  list: (search?: string, page = 1, limit = 20) =>
    api
      .get<ApiResponse<PaginatedResponse<User & { orders_count?: number; total_spent?: number }>>>("/admin/customers", {
        params: { search, page, limit },
      })
      .then((r) => r.data.data),

  get: (id: number) => api.get<ApiResponse<{ customer: User & { orders: Order[] } }>>(`/admin/customers/${id}`).then((r) => r.data.data.customer),
};

export const adminDeliveryApi = {
  list: () => api.get<ApiResponse<{ items: DeliveryZone[] }>>("/admin/delivery/zones").then((r) => r.data.data.items),

  create: (payload: { city_name: string; fee: number; is_active?: boolean }) =>
    api.post<ApiResponse<{ zone: DeliveryZone }>>("/admin/delivery/zones", payload).then((r) => r.data.data.zone),

  update: (id: number, payload: Partial<{ city_name: string; fee: number; is_active: boolean }>) =>
    api.put<ApiResponse<{ zone: DeliveryZone }>>(`/admin/delivery/zones/${id}`, payload).then((r) => r.data.data.zone),

  remove: (id: number) => api.delete<ApiResponse<Record<string, never>>>(`/admin/delivery/zones/${id}`),
};

export const adminReviewsApi = {
  list: (status?: string, page = 1, limit = 20) =>
    api
      .get<ApiResponse<PaginatedResponse<Review>>>("/admin/reviews", { params: { status, page, limit } })
      .then((r) => r.data.data),

  moderate: (id: number, status: "approved" | "rejected" | "pending") =>
    api.patch<ApiResponse<{ review: Review }>>(`/admin/reviews/${id}`, { status }).then((r) => r.data.data.review),

  remove: (id: number) => api.delete<ApiResponse<Record<string, never>>>(`/admin/reviews/${id}`),
};

export const adminGalleryApi = {
  list: () => api.get<ApiResponse<{ items: GalleryImage[] }>>("/admin/gallery").then((r) => r.data.data.items),

  upload: (file: File, meta: { title?: string; category?: string }) => {
    const formData = new FormData();
    formData.append("image", file);
    if (meta.title) formData.append("title", meta.title);
    if (meta.category) formData.append("category", meta.category);
    return api
      .post<ApiResponse<{ image: GalleryImage }>>("/admin/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data.image);
  },

  update: (id: number, payload: Partial<{ title: string; category: string; is_active: boolean; sort_order: number }>) =>
    api.put<ApiResponse<{ image: GalleryImage }>>(`/admin/gallery/${id}`, payload).then((r) => r.data.data.image),

  remove: (id: number) => api.delete<ApiResponse<Record<string, never>>>(`/admin/gallery/${id}`),
};

export const adminSettingsApi = {
  get: () => api.get<ApiResponse<{ settings: StoreSettings }>>("/admin/settings").then((r) => r.data.data.settings),

  update: (payload: Partial<StoreSettings>) =>
    api.put<ApiResponse<{ settings: StoreSettings }>>("/admin/settings", payload).then((r) => r.data.data.settings),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return api
      .post<ApiResponse<{ logo_url: string }>>("/admin/settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data.logo_url);
  },
};

export const adminDashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats").then((r) => r.data.data),
};

export const adminNotificationsApi = {
  list: (page = 1, limit = 15) =>
    api
      .get<ApiResponse<PaginatedResponse<AdminNotification> & { unread_count: number }>>("/admin/notifications", {
        params: { page, limit },
      })
      .then((r) => r.data.data),

  markRead: (id: number) => api.patch<ApiResponse<Record<string, never>>>(`/admin/notifications/${id}/read`),

  markAllRead: () => api.patch<ApiResponse<Record<string, never>>>("/admin/notifications/read-all"),
};
