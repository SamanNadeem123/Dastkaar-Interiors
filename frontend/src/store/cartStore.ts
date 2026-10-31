import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types";

export interface GuestCartItem {
  product_id: number;
  name: string;
  slug: string;
  image: string | null;
  unit_price: number;
  original_price: number;
  selected_color: string | null;
  quantity: number;
  availability: Product["availability"];
  stock_quantity: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (product: Product, quantity: number, color: string | null) => void;
  updateQuantity: (productId: number, color: string | null, quantity: number) => void;
  removeItem: (productId: number, color: string | null) => void;
  clear: () => void;
}

const sameLine = (item: GuestCartItem, productId: number, color: string | null) =>
  item.product_id === productId && item.selected_color === color;

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity, color) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, product.id, color));
          const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0];
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, product.id, color) ? { ...i, quantity: Math.min(i.quantity + quantity, 50) } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                image: primaryImage?.image_url ?? null,
                unit_price: product.sale_price ?? product.original_price,
                original_price: product.original_price,
                selected_color: color,
                quantity: Math.min(quantity, 50),
                availability: product.availability,
                stock_quantity: product.stock_quantity,
              },
            ],
          };
        }),
      updateQuantity: (productId, color, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (sameLine(i, productId, color) ? { ...i, quantity } : i)),
        })),
      removeItem: (productId, color) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, color)) })),
      clear: () => set({ items: [] }),
    }),
    { name: "nafv-guest-cart" }
  )
);

export function guestCartTotals(items: GuestCartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.original_price * i.quantity, 0);
  const discount = items.reduce((sum, i) => sum + (i.original_price - i.unit_price) * i.quantity, 0);
  return { subtotal, discount, total: subtotal - discount };
}
