import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import {
  Wishlist,
  Product,
} from '@/lib/models';

// ============================================================
// HELPERS
// ============================================================

function getVisitorId(
  request: NextRequest
) {
  const headerId =
    request.headers.get(
      'x-visitor-id'
    );

  if (headerId) {
    return headerId.trim();
  }

  const { searchParams } =
    new URL(request.url);

  const queryId =
    searchParams.get('visitor_id');

  return queryId?.trim() || null;
}

function isValidVisitorId(
  visitorId: string | null
) {
  if (!visitorId) return false;

  // Accept UUIDs and other persistent
  // browser-generated visitor IDs.
  return (
    visitorId.length >= 16 &&
    visitorId.length <= 100
  );
}

function isValidObjectId(
  id: string
) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// ============================================================
// GET /api/wishlist
//
// Get complete wishlist:
//
// /api/wishlist
//
// Check one product:
//
// /api/wishlist?product_id=PRODUCT_ID
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const visitorId =
      getVisitorId(request);

    if (
      !isValidVisitorId(visitorId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid visitor ID is required',
        },
        { status: 400 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const productId =
      searchParams.get(
        'product_id'
      );

    // ========================================================
    // CHECK SINGLE PRODUCT
    // ========================================================

    if (productId) {
      if (
        !isValidObjectId(productId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid product ID',
          },
          { status: 400 }
        );
      }

      const wishlistItem =
        await Wishlist.findOne({
          visitor_id: visitorId,
          product_id: productId,
        }).lean();

      return NextResponse.json({
        success: true,
        wishlisted:
          !!wishlistItem,
      });
    }

    // ========================================================
    // GET COMPLETE WISHLIST
    // ========================================================

    const wishlist =
      await Wishlist.find({
        visitor_id: visitorId,
      })
        .sort({
          created_at: -1,
        })
        .populate({
          path: 'product_id',
          select:
            'name slug price compare_price images stock badge ratings_avg ratings_count is_active',
        })
        .lean();

    const data =
      wishlist.filter(
        (item: any) =>
          item.product_id &&
          item.product_id
            .is_active !== false
      );

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error(
      'Wishlist GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch wishlist',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/wishlist
//
// Add product
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const visitorId =
      getVisitorId(request);

    if (
      !isValidVisitorId(visitorId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid visitor ID is required',
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const productId =
      body?.product_id;

    if (
      !productId ||
      !isValidObjectId(productId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid product ID is required',
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VERIFY PRODUCT
    // ========================================================

    const product =
      await Product.findOne({
        _id: productId,
        is_active: true,
      })
        .select('_id')
        .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Product not found',
        },
        { status: 404 }
      );
    }

    // ========================================================
    // CHECK EXISTING
    // ========================================================

    const existing =
      await Wishlist.findOne({
        visitor_id: visitorId,
        product_id: productId,
      }).lean();

    if (existing) {
      return NextResponse.json({
        success: true,
        wishlisted: true,
        message:
          'Product is already in wishlist',
      });
    }

    // ========================================================
    // CREATE
    // ========================================================

    await Wishlist.create({
      visitor_id: visitorId,
      product_id: productId,
    });

    return NextResponse.json(
      {
        success: true,
        wishlisted: true,
        message:
          'Product added to wishlist',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'Wishlist POST error:',
      error
    );

    if (
      error?.code === 11000
    ) {
      return NextResponse.json({
        success: true,
        wishlisted: true,
        message:
          'Product is already in wishlist',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to add product to wishlist',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/wishlist
//
// Toggle wishlist
// ============================================================

export async function PUT(
  request: NextRequest
) {
  try {
    await connectDB();

    const visitorId =
      getVisitorId(request);

    if (
      !isValidVisitorId(visitorId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid visitor ID is required',
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const productId =
      body?.product_id;

    if (
      !productId ||
      !isValidObjectId(productId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid product ID is required',
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VERIFY PRODUCT
    // ========================================================

    const product =
      await Product.findOne({
        _id: productId,
        is_active: true,
      })
        .select('_id')
        .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Product not found',
        },
        { status: 404 }
      );
    }

    // ========================================================
    // CHECK WISHLIST
    // ========================================================

    const existing =
      await Wishlist.findOne({
        visitor_id: visitorId,
        product_id: productId,
      });

    // ========================================================
    // REMOVE
    // ========================================================

    if (existing) {
      await Wishlist.deleteOne({
        _id: existing._id,
      });

      return NextResponse.json({
        success: true,
        wishlisted: false,
        message:
          'Product removed from wishlist',
      });
    }

    // ========================================================
    // ADD
    // ========================================================

    await Wishlist.create({
      visitor_id: visitorId,
      product_id: productId,
    });

    return NextResponse.json({
      success: true,
      wishlisted: true,
      message:
        'Product added to wishlist',
    });
  } catch (error: any) {
    console.error(
      'Wishlist PUT error:',
      error
    );

    if (
      error?.code === 11000
    ) {
      return NextResponse.json({
        success: true,
        wishlisted: true,
        message:
          'Product is already in wishlist',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update wishlist',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/wishlist
// ============================================================

export async function DELETE(
  request: NextRequest
) {
  try {
    await connectDB();

    const visitorId =
      getVisitorId(request);

    if (
      !isValidVisitorId(visitorId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid visitor ID is required',
        },
        { status: 400 }
      );
    }

    let productId =
      new URL(request.url)
        .searchParams
        .get('product_id');

    if (!productId) {
      try {
        const body =
          await request.json();

        productId =
          body?.product_id ||
          null;
      } catch {
        // No body
      }
    }

    if (
      !productId ||
      !isValidObjectId(productId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid product ID is required',
        },
        { status: 400 }
      );
    }

    const result =
      await Wishlist.deleteOne({
        visitor_id: visitorId,
        product_id: productId,
      });

    return NextResponse.json({
      success: true,
      wishlisted: false,
      message:
        result.deletedCount > 0
          ? 'Product removed from wishlist'
          : 'Product was not in wishlist',
    });
  } catch (error) {
    console.error(
      'Wishlist DELETE error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to remove product',
      },
      { status: 500 }
    );
  }
}