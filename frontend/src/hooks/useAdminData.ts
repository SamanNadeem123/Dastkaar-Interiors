import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiErrorMessage } from "../services/api";
import {
  adminProductsApi,
  adminCategoriesApi,
  adminOrdersApi,
  adminCustomersApi,
  adminDeliveryApi,
  adminReviewsApi,
  adminGalleryApi,
  adminSettingsApi,
  adminDashboardApi,
  type ProductAdminFilters,
  type ProductPayload,
  type OrderAdminFilters,
} from "../services/admin";
import type { StoreSettings } from "../types";

// ---------- Products ----------
export function useAdminProducts(filters: ProductAdminFilters) {
  return useQuery({ queryKey: ["admin-products", filters], queryFn: () => adminProductsApi.list(filters), placeholderData: (p) => p });
}

export function useAdminProduct(id: number | undefined) {
  return useQuery({ queryKey: ["admin-product", id], queryFn: () => adminProductsApi.get(id as number), enabled: !!id });
}

export function useAdminProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
  };

  const create = useMutation({
    mutationFn: (payload: ProductPayload) => adminProductsApi.create(payload),
    onSuccess: () => {
      toast.success("Product created successfully");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (vars: { id: number; payload: Partial<ProductPayload> }) => adminProductsApi.update(vars.id, vars.payload),
    onSuccess: (_, vars) => {
      toast.success("Product updated successfully");
      invalidate();
      qc.invalidateQueries({ queryKey: ["admin-product", vars.id] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const archive = useMutation({
    mutationFn: (id: number) => adminProductsApi.archive(id),
    onSuccess: () => {
      toast.success("Product archived");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const uploadImages = useMutation({
    mutationFn: (vars: { id: number; files: File[] }) => adminProductsApi.uploadImages(vars.id, vars.files),
    onSuccess: (_, vars) => {
      toast.success("Images uploaded");
      qc.invalidateQueries({ queryKey: ["admin-product", vars.id] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const deleteImage = useMutation({
    mutationFn: (vars: { productId: number; imageId: number }) => adminProductsApi.deleteImage(vars.productId, vars.imageId),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-product", vars.productId] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const setPrimaryImage = useMutation({
    mutationFn: (vars: { productId: number; imageId: number }) => adminProductsApi.setPrimaryImage(vars.productId, vars.imageId),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-product", vars.productId] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { create, update, archive, uploadImages, deleteImage, setPrimaryImage };
}

// ---------- Categories ----------
export function useAdminCategories() {
  return useQuery({ queryKey: ["admin-categories"], queryFn: adminCategoriesApi.list });
}

export function useAdminCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

  const create = useMutation({
    mutationFn: adminCategoriesApi.create,
    onSuccess: () => {
      toast.success("Category created successfully");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (vars: { id: number; payload: Parameters<typeof adminCategoriesApi.update>[1] }) =>
      adminCategoriesApi.update(vars.id, vars.payload),
    onSuccess: () => {
      toast.success("Category updated successfully");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const uploadImage = useMutation({
    mutationFn: (vars: { id: number; file: File }) => adminCategoriesApi.uploadImage(vars.id, vars.file),
    onSuccess: () => {
      toast.success("Category image updated");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminCategoriesApi.remove(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { create, update, uploadImage, remove };
}

// ---------- Orders ----------
export function useAdminOrders(filters: OrderAdminFilters) {
  return useQuery({ queryKey: ["admin-orders", filters], queryFn: () => adminOrdersApi.list(filters), placeholderData: (p) => p });
}

export function useAdminOrder(id: number | undefined) {
  return useQuery({ queryKey: ["admin-order", id], queryFn: () => adminOrdersApi.get(id as number), enabled: !!id });
}

export function useAdminOrderMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (vars: { id: number; status: string }) => adminOrdersApi.updateStatus(vars.id, vars.status),
    onSuccess: (_, vars) => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { updateStatus };
}

// ---------- Customers ----------
export function useAdminCustomers(search: string, page = 1) {
  return useQuery({ queryKey: ["admin-customers", search, page], queryFn: () => adminCustomersApi.list(search, page) });
}

export function useAdminCustomer(id: number | undefined) {
  return useQuery({ queryKey: ["admin-customer", id], queryFn: () => adminCustomersApi.get(id as number), enabled: !!id });
}

// ---------- Delivery zones ----------
export function useAdminDeliveryZones() {
  return useQuery({ queryKey: ["admin-delivery"], queryFn: adminDeliveryApi.list });
}

export function useAdminDeliveryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-delivery"] });

  const create = useMutation({
    mutationFn: adminDeliveryApi.create,
    onSuccess: () => {
      toast.success("Delivery zone created");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (vars: { id: number; payload: Parameters<typeof adminDeliveryApi.update>[1] }) =>
      adminDeliveryApi.update(vars.id, vars.payload),
    onSuccess: () => {
      toast.success("Delivery zone updated");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeliveryApi.remove(id),
    onSuccess: () => {
      toast.success("Delivery zone deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { create, update, remove };
}

// ---------- Reviews ----------
export function useAdminReviews(status?: string) {
  return useQuery({ queryKey: ["admin-reviews", status], queryFn: () => adminReviewsApi.list(status) });
}

export function useAdminReviewMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-reviews"] });

  const moderate = useMutation({
    mutationFn: (vars: { id: number; status: "approved" | "rejected" | "pending" }) => adminReviewsApi.moderate(vars.id, vars.status),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminReviewsApi.remove(id),
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { moderate, remove };
}

// ---------- Gallery ----------
export function useAdminGallery() {
  return useQuery({ queryKey: ["admin-gallery"], queryFn: adminGalleryApi.list });
}

export function useAdminGalleryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-gallery"] });

  const upload = useMutation({
    mutationFn: (vars: { file: File; meta: { title?: string; category?: string } }) => adminGalleryApi.upload(vars.file, vars.meta),
    onSuccess: () => {
      toast.success("Image uploaded");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (vars: { id: number; payload: Parameters<typeof adminGalleryApi.update>[1] }) =>
      adminGalleryApi.update(vars.id, vars.payload),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminGalleryApi.remove(id),
    onSuccess: () => {
      toast.success("Image deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { upload, update, remove };
}

// ---------- Settings ----------
export function useAdminSettings() {
  return useQuery({ queryKey: ["admin-settings"], queryFn: adminSettingsApi.get });
}

export function useAdminSettingsMutations() {
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: (payload: Partial<StoreSettings>) => adminSettingsApi.update(payload),
    onSuccess: () => {
      toast.success("Settings updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => adminSettingsApi.uploadLogo(file),
    onSuccess: () => {
      toast.success("Logo updated");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { update, uploadLogo };
}

// ---------- Dashboard ----------
export function useAdminDashboardStats() {
  return useQuery({ queryKey: ["admin-dashboard-stats"], queryFn: adminDashboardApi.stats, refetchInterval: 60_000 });
}
