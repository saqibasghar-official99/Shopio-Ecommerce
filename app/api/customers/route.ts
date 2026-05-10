import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/customers - Admin: list customers
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Customer.countDocuments(filter);
    const data = await Customer.find(filter)
      .select('-password_hash')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Register or login customer
// Body: { action: 'login' | 'register', email, password, name?, phone? }
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { action, email, phone, password } = body;

    // Login
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, data: null, message: 'Email and password are required' },
          { status: 400 }
        );
      }

      const customer = await Customer.findOne({ email });

      if (!customer) {
        return NextResponse.json(
          { success: false, data: null, message: 'No account found with this email' },
          { status: 404 }
        );
      }

      if (customer.password_hash !== password) {
        return NextResponse.json(
          { success: false, data: null, message: 'Invalid password' },
          { status: 401 }
        );
      }

      const { password_hash, ...safeCustomer } = customer.toObject();
      return NextResponse.json({ success: true, data: safeCustomer, message: 'Login successful' });
    }

    // Register
    if (action === 'register') {
      const { name } = body;
      if (!name || !email) {
        return NextResponse.json(
          { success: false, data: null, message: 'Name and email are required' },
          { status: 400 }
        );
      }
      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, data: null, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Check if customer already exists
      const existing = await Customer.findOne({ email });

      if (existing) {
        return NextResponse.json(
          { success: false, data: null, message: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const data = await Customer.create({
        name,
        email,
        phone: phone || '',
        password_hash: password,
        address: body.address || '',
        city: body.city || '',
        is_guest: false,
      });

      const { password_hash, ...safeCustomer } = data.toObject();
      return NextResponse.json(
        { success: true, data: safeCustomer, message: 'Account created successfully' },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, data: null, message: 'Invalid action. Use "login" or "register"' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
