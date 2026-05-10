import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/customers/[id] - Admin: get customer detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const data = await Customer.findById(id).select('-password_hash');

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Admin: update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Don't allow updating id or password_hash through this endpoint
    const { id: _id, password_hash, ...updates } = body;

    const data = await Customer.findByIdAndUpdate(id, updates, { new: true }).select('-password_hash');

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Admin: delete customer
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const data = await Customer.findByIdAndDelete(id);

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
