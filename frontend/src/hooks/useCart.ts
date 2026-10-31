import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useGuestCartStore, guestCartTotals } from "../store/cartStore";
import { cartApi } from "../services/cart";
import { apiErrorMessage } from "../services/api";
import type { Product } from "../types";

export interface UnifiedCartItem {
  key: string; // stable key for React lists: server item id, or `guest-{productId}-{color}`
  itemId: number | null; // server cart_item id, if authenticated
  productId: number;
  name: string;
  slug: string | null;
  image: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  availability: Product["availability"];
  stockQuantity: number;
}

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const guestItems = useGuestCartStore((s) => s.items);
  const guestAdd = useGuestCartStore((s) => s.addItem);
  const guestUpdate = useGuestCartStore((s) => s.updateQuantity);
  const guestRemove = useGuestCartStore((s) => s.removeItem);
  const guestClear = useGuestCartStore((s) => s.clear);

  const serverCartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  });

  const items: UnifiedCartItem[] = isAuthenticated
    ? (serverCartQuery.data?.items ?? []).map((i) => ({
        key: `server-${i.id}`,
        itemId: i.id,
        productId: i.product_id,
        name: i.product_name,
        slug: i.product_slug,
        image: i.product_image,
        color: i.selected_color,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        originalPrice: i.original_price,
        lineTotal: i.line_total,
        availability: i.availability,
        stockQuantity: i.stock_quantity,
      }))
    : guestItems.map((i) => ({
        key: `guest-${i.product_id}-${i.selected_color ?? "none"}`,
        itemId: null,
        productId: i.product_id,
        name: i.name,
        slug: i.slug,
        image: i.image,
        color: i.selected_color,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        originalPrice: i.original_price,
        lineTotal: i.unit_price * i.quantity,
        availability: i.availability,
        stockQuantity: i.stock_quantity,
      }));

  const totals = isAuthenticated
    ? {
        subtotal: serverCartQuery.data?.subtotal ?? 0,
        discount: serverCartQuery.data?.discount ?? 0,
        total: serverCartQuery.data?.total ?? 0,
      }
    : guestCartTotals(guestItems);

  const addMutation = useMutation({
    mutationFn: (vars: { productId: number; quantity: number; color: string | null }) =>
      cartApi.addItem({ product_id: vars.productId, quantity: vars.quantity, selected_color: vars.color }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { itemId: number; quantity: number }) => cartApi.updateItem(vars.itemId, vars.quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function addItem(product: Product, quantity: number, color: string | null) {
    if (product.availability === "out_of_stock") {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (isAuthenticated) {
      addMutation.mutate({ productId: product.id, quantity, color });
    } else {
      guestAdd(product, quantity, color);
    }
    toast.success(`${product.name} added to cart`);
  }

  function updateQuantity(item: UnifiedCartItem, quantity: number) {
    if (isAuthenticated && item.itemId) {
      updateMutation.mutate({ itemId: item.itemId, quantity });
    } else {
      guestUpdate(item.productId, item.color, quantity);
    }
  }

  function removeItem(item: UnifiedCartItem) {
    if (isAuthenticated && item.itemId) {
      removeMutation.mutate(item.itemId);
    } else {
      guestRemove(item.productId, item.color);
    }
    toast.success("Removed from cart");
  }

  /** Called once right after a guest logs in, to push their local cart into
   * the newly-authenticated server cart, then clear the local copy. */
  async function mergeGuestCartIntoServer() {
    if (guestItems.length === 0) return;
    try {
      await cartApi.mergeGuestCart(
        guestItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity, selected_color: i.selected_color }))
      );
      guestClear();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch {
      // Non-fatal: the guest cart simply stays in localStorage for next time.
    }
  }

  return {
    items,
    totals,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    isLoading: isAuthenticated && serverCartQuery.isLoading,
    addItem,
    updateQuantity,
    removeItem,
    mergeGuestCartIntoServer,
  };
}
