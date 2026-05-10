import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/reports/customers - Admin: top customers
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

    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$customer_email',
          customer_email: { $first: '$customer_email' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customer_email: 1,
          orderCount: 1,
          totalSpent: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: topCustomers,
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch customer report' },
      { status: 500 }
    );
  }
}
