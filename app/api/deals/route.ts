import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Deal from "@/lib/models/Deal";
import { connectDB } from '@/lib/mongodb';


export async function GET() {
  try {
    await connectDB();

    const deals = await Deal.find({})
      .sort({ sort_order: 1, created_at: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: deals,
    });
  } catch (error) {
    console.error("GET /api/deals error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch deals",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    const deal = await Deal.create({
      name: name.trim(),
      subtitle: subtitle?.trim() || "",
      image: image || "",
      href: href?.trim() || "/products",
      badge: badge?.trim() || "",
      is_active: is_active !== false,
      sort_order: Number(sort_order) || 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: deal,
        message: "Deal created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/deals error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create deal",
      },
      { status: 500 },
    );
  }
}