import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      productId,
      eventType,
      sessionId = null,
    } = body;

    // ---------------------------------------------------------
    // Validate product ID
    // ---------------------------------------------------------

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product ID is required',
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid product ID',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate event type
    // ---------------------------------------------------------

    if (!['visit', 'click'].includes(eventType)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid event type',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Save event
    // ---------------------------------------------------------

    await AnalyticsEvent.create({
      product_id: new mongoose.Types.ObjectId(productId),
      event_type: eventType,
      session_id: sessionId || null,
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded',
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to record analytics event',
      },
      { status: 500 }
    );
  }
}