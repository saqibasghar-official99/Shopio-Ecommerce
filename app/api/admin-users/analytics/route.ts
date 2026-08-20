import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import { Product, Order } from '@/lib/models';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const daysParam = Number(searchParams.get('days') || 30);

    const days = Number.isFinite(daysParam)
      ? Math.max(1, daysParam)
      : 30;

    // ============================================================
    // DATE RANGE
    // ============================================================

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    console.log('Analytics start date:', startDate);
    console.log('Analytics days:', days);

    // ============================================================
    // PRODUCTS
    // ============================================================

    const products = await Product.find({})
      .select('_id name slug')
      .lean();

    console.log('Products found:', products.length);

    // ============================================================
    // ANALYTICS EVENTS
    // ============================================================

    const events = await AnalyticsEvent.find({
      created_at: {
        $gte: startDate,
      },
      event_type: {
        $in: ['visit', 'click'],
      },
    })
      .select('product_id event_type created_at')
      .lean();

    console.log('Analytics events found:', events.length);

    // ============================================================
    // EVENT MAP
    // ============================================================

    const eventMap = new Map<
      string,
      {
        visits: number;
        clicks: number;
      }
    >();

    for (const event of events) {
      if (!event.product_id) {
        continue;
      }

      const productId = String(event.product_id);

      if (!eventMap.has(productId)) {
        eventMap.set(productId, {
          visits: 0,
          clicks: 0,
        });
      }

      const stats = eventMap.get(productId)!;

      if (event.event_type === 'visit') {
        stats.visits += 1;
      }

      if (event.event_type === 'click') {
        stats.clicks += 1;
      }
    }

    console.log(
      'Event map:',
      Object.fromEntries(eventMap)
    );

    // ============================================================
    // ORDERS
    // ============================================================

    const orders = await Order.find({
      created_at: {
        $gte: startDate,
      },
      order_status: {
        $ne: 'cancelled',
      },
    })
      .select('items total created_at')
      .lean();

    // ============================================================
    // ORDER MAP
    // ============================================================

    const orderMap = new Map<
      string,
      {
        orders: number;
        revenue: number;
      }
    >();

    for (const order of orders) {
      if (!Array.isArray(order.items)) {
        continue;
      }

      for (const item of order.items) {
        if (!item.productId) {
          continue;
        }

        const productId = String(item.productId);

        const quantity = Number(item.qty || 0);
        const unitPrice = Number(item.unitPrice || 0);

        if (!orderMap.has(productId)) {
          orderMap.set(productId, {
            orders: 0,
            revenue: 0,
          });
        }

        const stats = orderMap.get(productId)!;

        stats.orders += quantity;
        stats.revenue += unitPrice * quantity;
      }
    }

    // ============================================================
    // PRODUCT ANALYTICS
    // ============================================================

    const productAnalytics = products.map((product: any) => {
      const productId = String(product._id);

      const eventData = eventMap.get(productId) || {
        visits: 0,
        clicks: 0,
      };

      const orderData = orderMap.get(productId) || {
        orders: 0,
        revenue: 0,
      };

      return {
        product_id: productId,

        product_name:
          product.name || 'Unnamed Product',

        product_slug:
          product.slug || '',

        visits: eventData.visits,

        clicks: eventData.clicks,

        orders: orderData.orders,

        revenue: orderData.revenue,
      };
    });

    // ============================================================
    // TOTALS
    // ============================================================

    const totals = productAnalytics.reduce(
      (acc, product) => {
        acc.visits += product.visits;
        acc.clicks += product.clicks;
        acc.orders += product.orders;
        acc.revenue += product.revenue;

        return acc;
      },
      {
        visits: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
      }
    );

    console.log('Analytics totals:', totals);

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      days,
      startDate,
      totals,
      products: productAnalytics,
    });
  } catch (error) {
    console.error(
      'Admin analytics error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load analytics',
      },
      {
        status: 500,
      }
    );
  }
}