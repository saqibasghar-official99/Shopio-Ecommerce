import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Deal from "@/lib/models/Deal";
import { connectDB } from '@/lib/mongodb';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deal ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const {
      name,
      subtitle,
      image,
      href,
      badge,
      is_active,
      sort_order,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Deal name is required",
        },
        { status: 400 },
      );
    }

    const deal = await Deal.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        subtitle: subtitle?.trim() || "",
        image: image || "",
        href: href?.trim() || "/products",
        badge: badge?.trim() || "",
        is_active: is_active !== false,
        sort_order: Number(sort_order) || 0,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deal) {
      return NextResponse.json(
        {
          success: false,
          message: "Deal not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deal,
      message: "Deal updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/deals/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update deal",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deal ID",
        },
        { status: 400 },
      );
    }

    const deal = await Deal.findByIdAndDelete(id);

    if (!deal) {
      return NextResponse.json(
        {
          success: false,
          message: "Deal not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/deals/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete deal",
      },
      { status: 500 },
    );
  }
}