import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/reports/revenue - Admin: revenue data
export async function GET(_request: NextRequest) {
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
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Single $facet aggregation replaces 4 round-trips with 1.
    const [result] = await Order.aggregate([
      { $match: { payment_status: 'paid' } },
      {
        $facet: {
          total: [{ $group: { _id: null, v: { $sum: '$total' } } }],
          today: [
            { $match: { created_at: { $gte: startOfToday } } },
            { $group: { _id: null, v: { $sum: '$total' } } },
          ],
          month: [
            { $match: { created_at: { $gte: startOfMonth } } },
            { $group: { _id: null, v: { $sum: '$total' } } },
          ],
          monthly: [
            { $match: { created_at: { $gte: twelveMonthsAgo } } },
            {
              $group: {
                _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
                revenue: { $sum: '$total' },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
        },
      },
    ]);

    const totalRevenue = result?.total?.[0]?.v || 0;
    const todayRevenue = result?.today?.[0]?.v || 0;
    const monthRevenue = result?.month?.[0]?.v || 0;
    const monthlyBreakdown = (result?.monthly || []).map((entry: { _id: { year: number; month: number }; revenue: number }) => ({
      month: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
      revenue: entry.revenue,
    }));

    return NextResponse.json({
      success: true,
      data: { totalRevenue, todayRevenue, monthRevenue, monthlyBreakdown },
    });
  } catch (err) {
    console.error('Revenue report error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch revenue report' },
      { status: 500 }
    );
  }
}
