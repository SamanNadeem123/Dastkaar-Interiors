import api from "./api";
import type { ApiResponse, DeliveryZone, Review, GalleryImage, StoreSettings, Order } from "../types";

export const deliveryApi = {
  zones: () => api.get<ApiResponse<{ items: DeliveryZone[] }>>("/delivery/zones").then((r) => r.data.data.items),
  quote: (city: string) =>
    api
      .get<ApiResponse<{ city: string; delivery_charge: number }>>("/delivery/quote", { params: { city } })
      .then((r) => r.data.data.delivery_charge),
};

export const reviewsApi = {
  list: (productId?: number, page = 1, limit = 10) =>
    api
      .get<ApiResponse<{ items: Review[]; total: number; page: number; total_pages: number }>>("/reviews", {
        params: { product_id: productId, page, limit },
      })
      .then((r) => r.data.data),

  submit: (payload: { product_id?: number; customer_name: string; rating: number; comment?: string }) =>
    api.post<ApiResponse<{ review: Review }>>("/reviews", payload).then((r) => r.data.data.review),
};

export const galleryApi = {
  list: (category?: string) =>
    api
      .get<ApiResponse<{ items: GalleryImage[] }>>("/gallery", { params: { category } })
      .then((r) => r.data.data.items),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<{ settings: StoreSettings }>>("/settings").then((r) => r.data.data.settings),
};

export const paymentsApi = {
  sandboxConfirm: (orderNumber: string, simulate: "success" | "failed" = "success") =>
    api
      .post<ApiResponse<{ order: Order }>>("/payments/sandbox/confirm", { order_number: orderNumber, simulate })
      .then((r) => r.data.data.order),
};
