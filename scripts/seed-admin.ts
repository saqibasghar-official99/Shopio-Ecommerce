import 'dotenv/config';
import mongoose from 'mongoose';
import AdminUser from '../lib/models/AdminUser';

const MONGODB_URI = process.env.MONGODB_URI;

async function seedAdmin() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const existingAdmin = await AdminUser.findOne({
    email: 'admin@gmail.com',
  });

  if (existingAdmin) {
    console.log('Admin user already exists.');
    await mongoose.disconnect();
    return;
  }

  const admin = await AdminUser.create({
    name: 'Saqib Asghar',
    email: 'admin@gmail.com',
    password_hash: '12345678',
    phone: '+1234567890',
    role: 'super_admin',
  });

  console.log(`Admin created: ${admin.email}`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

seedAdmin().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});