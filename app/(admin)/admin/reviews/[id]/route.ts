import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  }
) {
  console.log('=================================');
  console.log('DELETE REVIEW ROUTE HIT');
  console.log('URL:', request.url);
  console.log('PARAMS:', params);
  console.log('=================================');

  try {
    await connectDB();

    const reviewId = params.id;

    console.log('REVIEW ID:', reviewId);

    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Review ID is required.',
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      console.log(
        'INVALID MONGODB OBJECT ID:',
        reviewId
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid review ID.',
          reviewId,
        },
        { status: 400 }
      );
    }

    const review =
      await Review.findById(reviewId).lean();

    console.log(
      'REVIEW FOUND BEFORE DELETE:',
      review
    );

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: 'Review not found in database.',
          reviewId,
        },
        { status: 404 }
      );
    }

    const result =
      await Review.deleteOne({
        _id: reviewId,
      });

    console.log(
      'DELETE RESULT:',
      result
    );

    if (result.deletedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Review could not be deleted.',
          reviewId,
          deletedCount: result.deletedCount,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully.',
      data: {
        id: reviewId,
      },
    });

  } catch (error) {
    console.error(
      'ADMIN REVIEW DELETE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete review.',
      },
      { status: 500 }
    );
  }
}