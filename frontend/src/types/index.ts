export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order?: number;
  product_count?: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductColor {
  id: number;
  color_name: string;
  color_code?: string | null;
}

export type Availability = "in_stock" | "out_of_stock" | "made_to_order" | "coming_soon";

export interface Product {
  id: number;
  category_id: number;
  category?: { id: number; name: string; slug: string };
  name: string;
  slug: string;
  sku: string;
  short_description?: string | null;
  description?: string | null;
  original_price: number;
  sale_price: number | null;
  discount_percent: number;
  material?: string | null;
  wood_type?: string | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  length?: number | null;
  weight?: number | null;
  dimension_unit: string;
  availability: Availability;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  is_active: boolean;
  images: ProductImage[];
  colors: ProductColor[];
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  product_slug: string;
  selected_color: string | null;
  quantity: number;
  unit_price: number;
  original_price: number;
  discount: number;
  line_total: number;
  availability: Availability;
  stock_quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "card";

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_image: string | null;
  selected_color: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface OrderStatusHistoryEntry {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

export interface Payment {
  id: number;
  provider: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  address?: string;
  city: string;
  postal_code?: string | null;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items?: OrderItem[];
  status_history?: OrderStatusHistoryEntry[];
  payments?: Payment[];
  created_at: string;
}

export interface Address {
  id?: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code?: string | null;
}

export type UserRole = "customer" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface DeliveryZone {
  id: number;
  city_name: string;
  fee: number;
  is_active: boolean;
}

export interface Review {
  id: number;
  product_id: number | null;
  customer_name: string;
  rating: number;
  comment?: string | null;
  image_url?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface GalleryImage {
  id: number;
  title?: string | null;
  category?: string | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface StoreSettings {
  store_name: string;
  phone: string;
  email: string;
  whatsapp_number: string;
  address: string;
  opening_hours: string;
  facebook_url?: string;
  instagram_url?: string;
  currency: string;
  logo_url?: string;
  [key: string]: unknown;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  related_order_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_orders: number;
  total_customers: number;
  total_sales: number;
  orders_by_status: Record<OrderStatus, number>;
  low_stock_count: number;
  out_of_stock_count: number;
  recent_orders: Order[];
  recent_products: Product[];
}
