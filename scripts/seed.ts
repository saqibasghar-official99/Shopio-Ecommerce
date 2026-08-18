import 'dotenv/config';
import mongoose from 'mongoose';
import { Category, Product, Customer, Order, Coupon, DeliveryZone, SiteSettings, AdminUser } from '../lib/models';

const MONGODB_URI = process.env.MONGODB_URI!;

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Clear existing data
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
    DeliveryZone.deleteMany({}),
    SiteSettings.deleteMany({}),
    AdminUser.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Categories
  const categories = await Category.create([
    { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and devices', image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg', is_active: true, sort_order: 0 },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg', is_active: true, sort_order: 1 },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home essentials', image: 'https://images.pexels.com/photos/1080746/pexels-photo-1080746.jpeg', is_active: true, sort_order: 2 },
    { name: 'Sports', slug: 'sports', description: 'Sports and outdoor gear', image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-46798.jpeg', is_active: true, sort_order: 3 },
    { name: 'Books', slug: 'books', description: 'Books and stationery', image: 'https://images.pexels.com/photos/1741230/pexels-photo-1741230.jpeg', is_active: true, sort_order: 4 },
  ]);
  console.log(`Created ${categories.length} categories`);

  // Products
  const products = await Product.create([
    { name: 'Wireless Headphones', slug: 'wireless-headphones', description: '<p>Premium wireless headphones with active noise cancellation and 30-hour battery life.</p>', short_description: 'Premium noise-cancelling headphones', category_id: categories[0]._id, price: 79.99, compare_price: 129.99, cost: 35, images: ['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', 'https://images.pexels.com/photos/1590543/pexels-photo-1590543.jpeg'], stock: 50, sku: 'WH-001', is_active: true, is_featured: true, tags: ['wireless', 'audio', 'sale'] },
    { name: 'Smart Watch Pro', slug: 'smart-watch-pro', description: '<p>Advanced smartwatch with health monitoring, GPS, and 5-day battery life.</p>', short_description: 'Advanced health monitoring watch', category_id: categories[0]._id, price: 199.99, compare_price: 249.99, cost: 80, images: ['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'], stock: 30, sku: 'SW-002', is_active: true, is_featured: true, tags: ['smart', 'wearable'] },
    { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: '<p>Portable waterproof Bluetooth speaker with 360-degree sound.</p>', short_description: 'Waterproof portable speaker', category_id: categories[0]._id, price: 49.99, compare_price: 69.99, cost: 20, images: ['https://images.pexels.com/photos/3629579/pexels-photo-3629579.jpeg'], stock: 100, sku: 'BS-003', is_active: true, is_featured: false, tags: ['audio', 'portable'] },
    { name: 'Cotton T-Shirt', slug: 'cotton-t-shirt', description: '<p>Soft premium cotton t-shirt available in multiple colors.</p>', short_description: 'Premium cotton tee', category_id: categories[1]._id, price: 24.99, compare_price: 0, cost: 8, images: ['https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg'], stock: 200, sku: 'CT-004', is_active: true, is_featured: false, tags: ['clothing', 'cotton'] },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: '<p>Classic denim jacket with modern fit and premium stitching.</p>', short_description: 'Classic denim jacket', category_id: categories[1]._id, price: 89.99, compare_price: 119.99, cost: 35, images: ['https://images.pexels.com/photos/6765164/pexels-photo-6765164.jpeg'], stock: 40, sku: 'DJ-005', is_active: true, is_featured: true, tags: ['clothing', 'denim', 'sale'] },
    { name: 'Running Shoes', slug: 'running-shoes', description: '<p>Lightweight running shoes with responsive cushioning.</p>', short_description: 'Lightweight running shoes', category_id: categories[3]._id, price: 119.99, compare_price: 149.99, cost: 45, images: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'], stock: 60, sku: 'RS-006', is_active: true, is_featured: true, tags: ['shoes', 'running', 'sale'] },
    { name: 'Coffee Maker', slug: 'coffee-maker', description: '<p>Programmable coffee maker with built-in grinder and thermal carafe.</p>', short_description: 'Programmable coffee maker', category_id: categories[2]._id, price: 59.99, compare_price: 79.99, cost: 25, images: ['https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg'], stock: 25, sku: 'CM-007', is_active: true, is_featured: false, tags: ['kitchen', 'coffee'] },
    { name: 'Yoga Mat', slug: 'yoga-mat', description: '<p>Non-slip yoga mat with alignment lines and carrying strap.</p>', short_description: 'Non-slip yoga mat', category_id: categories[3]._id, price: 34.99, compare_price: 0, cost: 12, images: ['https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'], stock: 80, sku: 'YM-008', is_active: true, is_featured: false, tags: ['yoga', 'fitness'] },
    { name: 'Bestseller Novel', slug: 'bestseller-novel', description: '<p>The #1 bestselling fiction novel of the year.</p>', short_description: '#1 bestselling novel', category_id: categories[4]._id, price: 14.99, compare_price: 19.99, cost: 5, images: ['https://images.pexels.com/photos/1741230/pexels-photo-1741230.jpeg'], stock: 150, sku: 'BN-009', is_active: true, is_featured: false, tags: ['books', 'fiction'] },
    { name: 'USB-C Hub', slug: 'usb-c-hub', description: '<p>7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.</p>', short_description: '7-in-1 USB-C hub', category_id: categories[0]._id, price: 39.99, compare_price: 54.99, cost: 15, images: ['https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg'], stock: 70, sku: 'UH-010', is_active: true, is_featured: false, tags: ['electronics', 'accessories'] },
  ]);
  console.log(`Created ${products.length} products`);

  // Customers
  const customers = await Customer.create([
    { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', password_hash: 'password123', address: '123 Main St', city: 'New York', is_guest: false },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', password_hash: 'password123', address: '456 Oak Ave', city: 'Los Angeles', is_guest: false },
  ]);
  console.log(`Created ${customers.length} customers`);

  // Orders
  const orders = await Order.create([
    {
      order_number: 'ORD-LATEST-001',
      customer_id: customers[0]._id,
      customer_name: 'John Doe',
      customer_phone: '+1234567890',
      customer_email: 'john@example.com',
      customer_address: '123 Main St',
      customer_city: 'New York',
      is_guest: false,
      items: [
        { productId: products[0]._id.toString(), name: 'Wireless Headphones', slug: 'wireless-headphones', image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', unitPrice: 79.99, comparePrice: 129.99, qty: 1 },
        { productId: products[5]._id.toString(), name: 'Running Shoes', slug: 'running-shoes', image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg', unitPrice: 119.99, comparePrice: 149.99, qty: 1 },
      ],
      subtotal: 199.98,
      discount: 0,
      delivery_fee: 5.99,
      total: 205.97,
      payment_method: 'cod',
      payment_status: 'pending',
      order_status: 'processing',
      delivery_zone: 'New York',
      coupon_code: '',
      notes: '',
    },
    {
      order_number: 'ORD-CONFIRMED-002',
      customer_id: customers[1]._id,
      customer_name: 'Jane Smith',
      customer_phone: '+1234567891',
      customer_email: 'jane@example.com',
      customer_address: '456 Oak Ave',
      customer_city: 'Los Angeles',
      is_guest: false,
      items: [
        { productId: products[1]._id.toString(), name: 'Smart Watch Pro', slug: 'smart-watch-pro', image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg', unitPrice: 199.99, comparePrice: 249.99, qty: 1 },
      ],
      subtotal: 199.99,
      discount: 20,
      delivery_fee: 0,
      total: 179.99,
      payment_method: 'bank',
      payment_status: 'paid',
      order_status: 'confirmed',
      delivery_zone: 'Los Angeles',
      coupon_code: 'SAVE20',
      notes: '',
    },
    {
      order_number: 'ORD-SHIPPED-003',
      customer_id: null,
      customer_name: 'Mike Wilson',
      customer_phone: '+1234567893',
      customer_email: 'mike@example.com',
      customer_address: '789 Pine Rd',
      customer_city: 'Chicago',
      is_guest: true,
      items: [
        { productId: products[4]._id.toString(), name: 'Denim Jacket', slug: 'denim-jacket', image: 'https://images.pexels.com/photos/6765164/pexels-photo-6765164.jpeg', unitPrice: 89.99, comparePrice: 119.99, qty: 2 },
      ],
      subtotal: 179.98,
      discount: 0,
      delivery_fee: 7.99,
      total: 187.97,
      payment_method: 'cod',
      payment_status: 'paid',
      order_status: 'shipped',
      delivery_zone: 'Chicago',
      coupon_code: '',
      notes: 'Leave at door',
    },
    {
      order_number: 'ORD-DELIVERED-004',
      customer_id: customers[0]._id,
      customer_name: 'John Doe',
      customer_phone: '+1234567890',
      customer_email: 'john@example.com',
      customer_address: '123 Main St',
      customer_city: 'New York',
      is_guest: false,
      items: [
        { productId: products[6]._id.toString(), name: 'Coffee Maker', slug: 'coffee-maker', image: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg', unitPrice: 59.99, comparePrice: 79.99, qty: 1 },
        { productId: products[8]._id.toString(), name: 'Bestseller Novel', slug: 'bestseller-novel', image: 'https://images.pexels.com/photos/1741230/pexels-photo-1741230.jpeg', unitPrice: 14.99, comparePrice: 19.99, qty: 2 },
      ],
      subtotal: 89.97,
      discount: 0,
      delivery_fee: 5.99,
      total: 95.96,
      payment_method: 'bank',
      payment_status: 'paid',
      order_status: 'delivered',
      delivery_zone: 'New York',
      coupon_code: '',
      notes: '',
    },
  ]);
  console.log(`Created ${orders.length} orders`);

  // Coupons
  await Coupon.create([
    { code: 'SAVE20', type: 'fixed', value: 20, min_order: 100, max_uses: 100, used_count: 5, expires_at: new Date(new Date().getFullYear() + 1, 11, 31), is_active: true },
    { code: 'WELCOME10', type: 'percent', value: 10, min_order: 0, max_uses: 200, used_count: 12, expires_at: new Date(new Date().getFullYear() + 1, 11, 31), is_active: true },
    { code: 'FREESHIP', type: 'fixed', value: 0, min_order: 50, max_uses: 50, used_count: 3, expires_at: new Date(new Date().getFullYear() + 1, 5, 30), is_active: true },
  ]);
  console.log('Created coupons');

  // Delivery Zones
  await DeliveryZone.create([
    { name: 'New York', cities: ['New York', 'Brooklyn', 'Queens'], fee: 5.99, is_active: true },
    { name: 'Los Angeles', cities: ['Los Angeles', 'Santa Monica', 'Beverly Hills'], fee: 7.99, is_active: true },
    { name: 'Chicago', cities: ['Chicago', 'Evanston'], fee: 6.99, is_active: true },
    { name: 'Free Shipping Zone', cities: ['Miami', 'Dallas'], fee: 0, is_active: true },
  ]);
  console.log('Created delivery zones');

  // Site Settings
  await SiteSettings.create({
    store_name: 'ShopEase',
    logo: '',
    phone: '+1 234 567 8900',
    whatsapp_number: '1234567890',
    whatsapp_message: 'Hi, I want to place an order',
    address: '123 Store Street, New York, NY 10001',
    currency: '$',
    social_links: { facebook: 'https://facebook.com/shopease', instagram: 'https://instagram.com/shopease' },
    meta_title: 'ShopEase - Your One-Stop Online Store',
    meta_desc: 'Shop the best products at great prices with free shipping on orders over $50.',
    banners: [
      { image: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg', link: '/products', isActive: true },
      { image: 'https://images.pexels.com/photos/5632381/pexels-photo-5632381.jpeg', link: '/products', isActive: true },
    ],
    announcement_bar: { text: 'Free shipping on orders over $50!', isActive: true },
    shipping_policy: 'We ship within 2-3 business days. Free shipping on orders over $50.',
    return_policy: 'Returns accepted within 7 days of delivery. Items must be unused and in original packaging.',
    about_text: 'ShopEase is your one-stop online store for quality products at great prices.',
  });
  console.log('Created site settings');

  // Admin Users
  await AdminUser.create([
    { name: 'Admin', email: 'admin@shopease.com', password_hash: 'Admin@2024', phone: '+1234567890', role: 'super_admin' },
  ]);
  console.log('Created admin users');

  console.log('\nSeed completed successfully!');
  await mongoose.disconnect();
} 

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
