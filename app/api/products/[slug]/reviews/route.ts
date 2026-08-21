import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import { Product, Order } from '@/lib/models';
import Review from '@/lib/models/Review';

export const dynamic = 'force-dynamic';

// ============================================================
// GET PRODUCT REVIEWS
// ============================================================

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ slug: string }>;
    }
) {
    try {
        await connectDB();

        const { slug } = await params;

        const cleanSlug = decodeURIComponent(slug).trim();

        if (!cleanSlug) {
            return NextResponse.json(
                {
                    success: false,
                    data: [],
                    message: 'Product slug is required.',
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // FIND PRODUCT
        // --------------------------------------------------------

        const product = await Product.findOne({
            slug: cleanSlug,
        })
            .select('_id name slug images')
            .lean();

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    data: [],
                    message: 'Product not found.',
                },
                { status: 404 }
            );
        }

        // --------------------------------------------------------
        // FIND REVIEWS
        // --------------------------------------------------------

        const reviews = await Review.find({
            product_id: product._id,
        })
            .sort({
                created_at: -1,
            })
            .lean();

        // --------------------------------------------------------
        // RETURN REVIEWS
        // --------------------------------------------------------

        const formattedReviews = reviews.map((review) => ({
            ...review,
            id: review._id.toString(),
            name: review.customer_name,
            _id: review._id.toString(),
            product_id: review.product_id.toString(),
            order_id: review.order_id.toString(),
        }));

        return NextResponse.json(
            {
                success: true,
                data: formattedReviews,
                product: {
                    _id: product._id.toString(),
                    name: product.name,
                    slug: product.slug,
                    images: product.images || [],
                },
                count: formattedReviews.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            'GET PRODUCT REVIEWS ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                data: [],
                message: 'Failed to fetch product reviews.',
            },
            { status: 500 }
        );
    }
}

// ============================================================
// POST PRODUCT REVIEW
// ============================================================

export async function POST(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ slug: string }>;
    }
) {
    try {
        await connectDB();

        const { slug } = await params;

        const cleanSlug = decodeURIComponent(slug).trim();

        // --------------------------------------------------------
        // READ REQUEST BODY
        // --------------------------------------------------------

        const body = await request.json();

        const {
            orderId,
            customerName,
            guestCustomerId,
            rating,
            comment,
        } = body;

        console.log('POST REVIEW BODY:', {
            orderId,
            customerName,
            guestCustomerId,
            rating,
            comment,
        });

        // --------------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------------

        if (!orderId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Order ID is required.',
                },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid order ID.',
                },
                { status: 400 }
            );
        }

        if (!guestCustomerId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Guest customer ID is required.',
                },
                { status: 400 }
            );
        }


        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Rating must be between 1 and 5.',
                },
                { status: 400 }
            );
        }

        if (!comment || !comment.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Review comment is required.',
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // FIND PRODUCT
        // --------------------------------------------------------

        const product = await Product.findOne({
            slug: cleanSlug,
        })
            .select('_id name')
            .lean();

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Product not found.',
                },
                { status: 404 }
            );
        }

        // --------------------------------------------------------
        // FIND ORDER
        //
        // We verify the order again here.
        // Never trust only the frontend eligibility result.
        // --------------------------------------------------------

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            guest_customer_id: guestCustomerId,
            payment_status: 'paid',
            order_status: 'delivered',
        }).lean();

        if (!order) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'This order could not be verified.',
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------------
        // CHECK PRODUCT EXISTS IN ORDER
        // --------------------------------------------------------

        const hasProduct = order.items?.some(
            (item: { productId: string }) =>
                String(item.productId) ===
                String(product._id)
        );

        if (!hasProduct) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'This product was not found in the order.',
                },
                { status: 403 }
            );
        }

        // --------------------------------------------------------
        // CHECK DUPLICATE REVIEW
        // --------------------------------------------------------

        const existingReview = await Review.findOne({
            product_id: product._id,
            order_id: order._id,
        }).lean();

        if (existingReview) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'You have already submitted a review for this product.',
                },
                { status: 409 }
            );
        }

        // --------------------------------------------------------
        // GET CUSTOMER PHONE FROM ORDER
        // --------------------------------------------------------

        const customerPhone =
            order.customer_phone ||
            order.phone ||
            '';

        if (!customerPhone) {
            console.error(
                'Customer phone missing from order:',
                order._id
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Customer phone number is missing from this order.',
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // CREATE REVIEW
        // --------------------------------------------------------

        const review = await Review.create({
            product_id: product._id,

            customer_id: null,

            order_id: order._id,

            customer_name:
                customerName ||
                order.customer_name ||
                'Customer',

            customer_phone: customerPhone,

            rating: Number(rating),

            comment: comment.trim(),

            is_approved: true,
        });

        // --------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------

        return NextResponse.json(
            {
                success: true,
                message:
                    'Review submitted successfully.',
                data: {
                    id: review._id.toString(),
                    customer_name: review.customer_name,
                    rating: review.rating,
                    comment: review.comment,
                    is_approved: review.is_approved,
                    created_at: review.created_at,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error(
            'POST PRODUCT REVIEW ERROR:',
            error
        );

        // --------------------------------------------------------
        // MONGOOSE VALIDATION ERROR
        // --------------------------------------------------------

        if (
            error instanceof mongoose.Error.ValidationError
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        Object.values(error.errors)
                            .map((err) => err.message)
                            .join(', '),
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------------
        // DUPLICATE KEY ERROR
        // --------------------------------------------------------

        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'You have already reviewed this product for this order.',
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    'Unable to submit your review.',
            },
            { status: 500 }
        );
    }
}