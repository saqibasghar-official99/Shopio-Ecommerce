import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import { Product, Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

/**
 * POST /admin/reviews
 *
 * Creates an admin-created/fake review.
 *
 * Expected body:
 * {
 *   productId: string,
 *   customerName: string,
 *   rating: number,
 *   comment: string
 * }
 *
 * For admin-created reviews:
 * - customer_id = null
 * - order_id = null
 * - is_approved = true
 * - verified = false
 */
export async function POST(
  request: NextRequest
) {
  try {
    // ============================================================
    // CONNECT DATABASE
    // ============================================================

    await connectDB();


    // ============================================================
    // READ REQUEST BODY
    // ============================================================

    const body = await request.json();

    const productId =
      typeof body.productId === 'string'
        ? body.productId.trim()
        : '';

    const customerName =
      typeof body.customerName === 'string'
        ? body.customerName.trim()
        : '';

    const rating =
      Number(body.rating);

    const comment =
      typeof body.comment === 'string'
        ? body.comment.trim()
        : '';


    // ============================================================
    // VALIDATION
    // ============================================================

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product is required.',
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid product ID.',
        },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer name is required.',
        },
        { status: 400 }
      );
    }

    if (customerName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Customer name must not exceed 100 characters.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Rating must be a whole number between 1 and 5.',
        },
        { status: 400 }
      );
    }

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Review comment is required.',
        },
        { status: 400 }
      );
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Review comment must not exceed 2000 characters.',
        },
        { status: 400 }
      );
    }


    // ============================================================
    // FIND PRODUCT
    // ============================================================
    //
    // IMPORTANT:
    //
    // The admin UI sends the MongoDB Product _id.
    //
    // We therefore find the product directly by _id.
    //
    // We do NOT use:
    //
    // /api/products/PRODUCT-SLUG/reviews
    //
    // here.
    // ============================================================

    const product =
      await Product.findById(
        productId
      ).lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product not found.',
        },
        { status: 404 }
      );
    }


    // ============================================================
    // CREATE ADMIN / FAKE REVIEW
    // ============================================================
    //
    // customer_id and order_id remain null because this is
    // an admin-created review and is not connected to a real
    // customer/order.
    //
    // is_approved = true means it appears immediately.
    // verified = false because it is not a verified purchase.
    // ============================================================

    const review =
      await Review.create({
        product_id:
          product._id,

        customer_id:
          null,

        order_id:
          null,

        customer_name:
          customerName,

        customer_phone:
          '',

        rating,

        comment,

        is_approved:
          true,

        verified:
          false,

        is_verified:
          false,
      });


    // ============================================================
    // UPDATE PRODUCT RATING SUMMARY
    // ============================================================
    //
    // Add this review to the product's rating statistics.
    // ============================================================

    const currentRatingCount =
      Number(product.ratings_count || 0);

    const currentRatingAverage =
      Number(product.ratings_avg || 0);

    const newRatingCount =
      currentRatingCount + 1;

    const newRatingAverage =
      (
        (
          currentRatingAverage *
          currentRatingCount
        ) +
        rating
      ) /
      newRatingCount;


    await Product.findByIdAndUpdate(
      product._id,
      {
        $set: {
          ratings_count:
            newRatingCount,

          ratings_avg:
            Number(
              newRatingAverage.toFixed(2)
            ),
        },
      }
    );


    // ============================================================
    // RETURN CREATED REVIEW
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          'Review added successfully.',

        data: {
          id:
            String(review._id),

          _id:
            String(review._id),

          product_id:
            String(product._id),

          product_name:
            product.name,

          product_title:
            product.name,

          product: {
            id:
              String(product._id),

            _id:
              String(product._id),

            name:
              product.name,

            title:
              product.name,

            slug:
              product.slug,

            image:
              product.images?.[0] || '',
          },

          customer_name:
            customerName,

          customerName:
            customerName,

          name:
            customerName,

          customer_id:
            null,

          order_id:
            null,

          rating,

          comment,

          is_approved:
            true,

          verified:
            false,

          is_verified:
            false,

          created_at:
            review.created_at,

          createdAt:
            review.created_at,
        },
      },
      { status: 201 }
    );

  } catch (error) {

    console.error(
      'ADMIN CREATE REVIEW ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'Failed to create review.',
      },
      { status: 500 }
    );
  }
}