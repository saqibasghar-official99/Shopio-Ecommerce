

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



export interface Deal {
  _id?: string;

  id: string;

  name: string;

  subtitle: string;

  image: string;

  href: string;

  badge?: string;

  is_active: boolean;

  sort_order: number;

  created_at: string;

  updated_at?: string;
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
  badge?: string;
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

  // =========================
  // ORDER IDENTIFICATION
  // =========================

  order_number: string;

  // =========================
  // CUSTOMER
  // =========================

  customer_id: string | null;
  guest_customer_id?: string | null;

  customer_name: string;
  customer_phone: string;
  customer_email: string;

  // =========================
  // SHIPPING INFORMATION
  // =========================

  customer_address: string;
  customer_city: string;
  delivery_zone: string;

  // =========================
  // BILLING INFORMATION
  // =========================

  billing_same_as_shipping: boolean;

  billing_name: string;
  billing_phone: string;
  billing_email: string;
  billing_address: string;
  billing_city: string;
  billing_zone: string;

  // =========================
  // ORDER
  // =========================

  is_guest: boolean;

  items: OrderItem[];

  // =========================
  // PRICING
  // =========================

  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;

  // =========================
  // PAYMENT
  // =========================


  payment_method: string;
  payment_status: string;
  payment_proof?: string;
  payment_proof_name?: string;
  bank_transfer_discount?: number;

  // =========================
  // STATUS
  // =========================

  order_status: string;

  // =========================
  // OTHER
  // =========================

  coupon_code: string;
  notes: string;
  invoice_url: string;

  created_at: string;
  updated_at?: string;
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
  email: string; // ← ADD THIS
  whatsapp_number: string;
  whatsapp_message: string;
  address: string;
  currency: string;
  social_links: Record<string, string>;
  meta_title: string;
  meta_desc: string;
  banners: Banner[];
  announcement_bar: {
    text: string;
    isActive: boolean;
  };
  shipping_policy: string;
  return_policy: string;
  about_text: string;
  created_at: string;
}

export interface Banner {
  type: 'image' | 'video';
  image: string;
  video: string;
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