import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/lib/models/SiteSettings";

/* ============================================================
   GET DEALS SECTION SETTINGS
============================================================ */

export async function GET() {
  try {
    await connectDB();

    let settings = await SiteSettings.findOne();

    /*
     * Create default settings if they don't exist.
     */
    if (!settings) {
      settings = await SiteSettings.create({
        deals_section: {
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      show_section:
        settings.deals_section?.isActive !== false,
    });
  } catch (error) {
    console.error(
      "GET /api/deals/settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch deals settings",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE DEALS SECTION SETTINGS
============================================================ */

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    /*
     * Explicitly convert the incoming value to boolean.
     */
    const showSection = Boolean(body.show_section);

    let settings = await SiteSettings.findOne();

    /*
     * Create settings if they don't exist.
     */
    if (!settings) {
      settings = await SiteSettings.create({
        deals_section: {
          isActive: showSection,
        },
      });
    } else {
      /*
       * Update the existing nested setting.
       */
      settings.deals_section = {
        isActive: showSection,
      };

      await settings.save();
    }

    return NextResponse.json({
      success: true,
      show_section:
        settings.deals_section.isActive,
      message:
        "Deals section visibility updated",
    });
  } catch (error) {
    console.error(
      "PUT /api/deals/settings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update deals settings",
      },
      { status: 500 }
    );
  }
}