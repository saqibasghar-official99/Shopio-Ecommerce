import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/reports/revenue - Admin: revenue data
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

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Total revenue
    const totalResult = await Order.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);
    const totalRevenue = totalResult[0]?.totalRevenue || 0;

    // Today's revenue
    const todayResult = await Order.aggregate([
      { $match: { payment_status: 'paid', created_at: { $gte: startOfToday } } },
      { $group: { _id: null, todayRevenue: { $sum: '$total' } } },
    ]);
    const todayRevenue = todayResult[0]?.todayRevenue || 0;

    // This month's revenue
    const monthResult = await Order.aggregate([
      { $match: { payment_status: 'paid', created_at: { $gte: startOfMonth } } },
      { $group: { _id: null, monthRevenue: { $sum: '$total' } } },
    ]);
    const monthRevenue = monthResult[0]?.monthRevenue || 0;

    // Monthly breakdown for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyBreakdown = await Order.aggregate([
      { $match: { payment_status: 'paid', created_at: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
          },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const formattedMonthlyBreakdown = monthlyBreakdown.map((entry) => ({
      month: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
      revenue: entry.revenue,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        monthlyBreakdown: formattedMonthlyBreakdown,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch revenue report' },
      { status: 500 }
    );
  }
}
