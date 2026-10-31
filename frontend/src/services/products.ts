import api from "./api";
import type { ApiResponse, PaginatedResponse, Product } from "../types";

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string; // category slug
  material?: string;
  wood_type?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  availability?: string;
  is_featured?: boolean;
  is_on_sale?: boolean;
  sort?: "newest" | "price_low" | "price_high" | "popular" | "discount" | "featured";
}

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    api
      .get<ApiResponse<PaginatedResponse<Product>>>("/products", { params: filters })
      .then((r) => r.data.data),

  filterOptions: () =>
    api
      .get<ApiResponse<{ materials: string[]; wood_types: string[]; colors: string[]; min_price: number; max_price: number }>>(
        "/products/filters"
      )
      .then((r) => r.data.data),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<{ product: Product }>>(`/products/${slug}`).then((r) => r.data.data.product),

  getRelated: (slug: string) =>
    api.get<ApiResponse<{ items: Product[] }>>(`/products/${slug}/related`).then((r) => r.data.data.items),
};
