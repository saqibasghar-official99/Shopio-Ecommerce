import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/reports/products - Admin: top selling products
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

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productId: { $first: '$items.productId' },
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.qty' },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: 1,
          name: 1,
          totalQty: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: topProducts,
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch products report' },
      { status: 500 }
    );
  }
}
