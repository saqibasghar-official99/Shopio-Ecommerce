import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, Product, Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;

    const { searchParams } = new URL(request.url);
    const guestCustomerId =
      searchParams.get('guestCustomerId');

    // ------------------------------------------------------------
    // Validate guest customer ID
    // ------------------------------------------------------------

    if (!guestCustomerId) {
      return NextResponse.json(
        {
          success: false,
          canReview: false,
          message: 'Guest customer ID is required.',
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Find product
    // ------------------------------------------------------------

    const product = await Product.findOne({
      slug,
    })
      .select('_id name')
      .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          canReview: false,
          message: 'Product not found.',
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // Find customer's delivered + paid orders
    // ------------------------------------------------------------

    // const orders = await Order.find({
    //   guest_customer_id: guestCustomerId,
    //   payment_status: 'paid',
    //   order_status: 'delivered',
    // })
    //   .sort({ created_at: -1 })
    //   .lean();


    const orders = await Order.find({
      guest_customer_id: guestCustomerId,
    })
      .sort({ created_at: -1 })
      .lean();

    if (!orders.length) {
      return NextResponse.json({
        success: true,
        canReview: false,
        message:
          'We could not find a delivered order for this customer.',
      });
    }

    // ------------------------------------------------------------
    // Find an order containing this product
    // ------------------------------------------------------------

    let matchingOrder = null;

    for (const order of orders) {
      const hasProduct = order.items?.some(
        (item: {
          productId: string;
        }) =>
          String(item.productId) ===
          String(product._id)
      );

      if (hasProduct) {
        matchingOrder = order;
        break;
      }
    }

    if (!matchingOrder) {
      return NextResponse.json({
        success: true,
        canReview: false,
        message:
          'You have not purchased this product.',
      });
    }

    // ------------------------------------------------------------
    // Check duplicate review
    // ------------------------------------------------------------

    const existingReview = await Review.findOne({
      product_id: product._id,
      order_id: matchingOrder._id,
    }).lean();

    if (existingReview) {
      return NextResponse.json({
        success: true,
        canReview: false,
        message:
          'You have already submitted a review for this product.',
      });
    }

    // ------------------------------------------------------------
    // Eligible
    // ------------------------------------------------------------

    return NextResponse.json({
      success: true,
      canReview: true,
      orderId: matchingOrder._id.toString(),
      customerName: matchingOrder.customer_name,
      message:
        'You purchased and received this product. You can leave a review.',
    });
  } catch (error) {
    console.error(
      'Review eligibility error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        canReview: false,
        message:
          'Unable to verify your order right now. Please try again.',
      },
      { status: 500 }
    );
  }
}