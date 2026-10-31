import api from "./api";
import type { ApiResponse, Category } from "../types";

export const categoriesApi = {
  list: () => api.get<ApiResponse<{ items: Category[] }>>("/categories").then((r) => r.data.data.items),
  getBySlug: (slug: string) =>
    api.get<ApiResponse<{ category: Category }>>(`/categories/${slug}`).then((r) => r.data.data.category),
};
