import 'dotenv/config';
import mongoose from 'mongoose';
import {
  Category,
  Product,
  Customer,
  Order,
  Coupon,
  DeliveryZone,
  AdminUser,
} from '../lib/models';
 
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Building indexes (this runs once, safe to re-run)...');

  const models = [
    { name: 'Product', model: Product },
    { name: 'Category', model: Category },
    { name: 'Customer', model: Customer },
    { name: 'Order', model: Order },
    { name: 'Coupon', model: Coupon },
    { name: 'DeliveryZone', model: DeliveryZone },
    { name: 'AdminUser', model: AdminUser },
  ];

  for (const { name, model } of models) {
    process.stdout.write(`  ${name} ... `);
    await model.syncIndexes();
    console.log('done');
  }

  console.log('All indexes ensured.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
