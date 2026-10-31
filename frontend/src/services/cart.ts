import api from "./api";
import type { ApiResponse, Cart } from "../types";

export interface AddCartItemPayload {
  product_id: number;
  quantity: number;
  selected_color?: string | null;
}

export const cartApi = {
  get: () => api.get<ApiResponse<{ cart: Cart }>>("/cart").then((r) => r.data.data.cart),

  addItem: (payload: AddCartItemPayload) =>
    api.post<ApiResponse<{ cart: Cart }>>("/cart/items", payload).then((r) => r.data.data.cart),

  updateItem: (itemId: number, quantity: number) =>
    api.put<ApiResponse<{ cart: Cart }>>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data.data.cart),

  removeItem: (itemId: number) =>
    api.delete<ApiResponse<{ cart: Cart }>>(`/cart/items/${itemId}`).then((r) => r.data.data.cart),

  clear: () => api.delete<ApiResponse<Record<string, never>>>("/cart"),

  mergeGuestCart: (
    items: { product_id: number; quantity: number; selected_color: string | null }[]
  ) => api.post<ApiResponse<{ cart: Cart }>>("/cart/merge", { items }).then((r) => r.data.data.cart),
};
