import { useQuery } from "@tanstack/react-query";
import { productsApi, type ProductFilters } from "../services/products";
import { categoriesApi } from "../services/categories";
import { deliveryApi } from "../services/misc";
import { settingsApi } from "../services/misc";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug, "related"],
    queryFn: () => productsApi.getRelated(slug as string),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useProductFilterOptions() {
  return useQuery({
    queryKey: ["product-filter-options"],
    queryFn: productsApi.filterOptions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: () => categoriesApi.getBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useDeliveryQuote(city: string) {
  return useQuery({
    queryKey: ["delivery-quote", city],
    queryFn: () => deliveryApi.quote(city),
    enabled: !!city,
  });
}

export function useStoreSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: settingsApi.get, staleTime: 5 * 60 * 1000 });
}
