import api from "./api";
import type { ApiResponse, Order, Address, PaginatedResponse } from "../types";

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
  selected_color?: string | null;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  address: string;
  city: string;
  postal_code?: string;
  payment_method: "cod" | "card";
  items: OrderItemPayload[];
  idempotency_key?: string;
  save_address?: boolean;
}

export const ordersApi = {
  create: (payload: CreateOrderPayload) =>
    api.post<ApiResponse<{ order: Order }>>("/orders", payload).then((r) => r.data.data.order),

  myOrders: (page = 1, limit = 10) =>
    api.get<ApiResponse<PaginatedResponse<Order>>>("/orders", { params: { page, limit } }).then((r) => r.data.data),

  getByNumber: (orderNumber: string) =>
    api.get<ApiResponse<{ order: Order }>>(`/orders/${orderNumber}`).then((r) => r.data.data.order),

  getDefaultAddress: () =>
    api.get<ApiResponse<{ address: Address | null }>>("/orders/address/default").then((r) => r.data.data.address),

  saveAddress: (payload: Address) =>
    api.post<ApiResponse<{ address: Address }>>("/orders/address", payload).then((r) => r.data.data.address),
};
