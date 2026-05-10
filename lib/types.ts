export interface Category {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  image: string;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  images: string[];
  category_id: string;
  sub_category: string;
  price: number;
  compare_price: number;
  cost_price: number;
  stock: number;
  sku: string;
  weight: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  variants: Variant[];
  specifications?: { key: string; value: string }[];
  ratings_avg: number;
  ratings_count: number;
  created_at: string;
  category?: Category;
}

export interface Variant {
  label: string;
  options: string[];
}

export interface Customer {
  _id?: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  password_hash?: string;
  address: string;
  city: string;
  is_guest: boolean;
  total_orders: number;
  total_spent: number;
  total_due: number;
  created_at: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  qty: number;
  unitPrice: number;
  variant?: string;
}

export interface Order {
  _id?: string;
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  is_guest: boolean;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_zone: string;
  coupon_code: string;
  notes: string;
  invoice_url: string;
  created_at: string;
}

export interface Coupon {
  _id?: string;
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
}

export interface DeliveryZone {
  _id?: string;
  id: string;
  name: string;
  cities: string[];
  fee: number;
  is_active: boolean;
  created_at: string;
}

export interface SiteSettings {
  _id?: string;
  id: string;
  store_name: string;
  logo: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_message: string;
  address: string;
  currency: string;
  social_links: Record<string, string>;
  meta_title: string;
  meta_desc: string;
  banners: Banner[];
  announcement_bar: { text: string; isActive: boolean };
  shipping_policy: string;
  return_policy: string;
  about_text: string;
  created_at: string;
}

export interface Banner {
  image: string;
  link: string;
  isActive: boolean;
}

export interface Review {
  _id?: string;
  id: string;
  product_id: string;
  customer_id: string | null;
  name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface Transaction {
  _id?: string;
  id: string;
  order_id: string | null;
  customer_id: string | null;
  type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  method: string;
  reference: string;
  notes: string;
  created_at: string;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  comparePrice: number;
  qty: number;
  variant?: string;
  stock: number;
}

export interface AdminUser {
  email: string;
  name: string;
  role?: string;
}
