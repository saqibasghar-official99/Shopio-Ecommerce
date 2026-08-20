import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getAdminFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

// Maximum upload size: 100 MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const type = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Detect file type
    // ------------------------------------------------------------

    const mimeType = file.type || "";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    // ------------------------------------------------------------
    // Only images/videos are allowed
    // ------------------------------------------------------------

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          message: "Only image and video files are allowed",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Logo must be an image
    // ------------------------------------------------------------

    if (type === "logo" && !isImage) {
      return NextResponse.json(
        {
          success: false,
          message: "Logo must be an image file",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // File size validation
    // ------------------------------------------------------------

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File must be smaller than 100MB",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Cloudinary folder
    // ------------------------------------------------------------

    let folder = "shopio/settings";

    if (type === "logo") {
      folder = "shopio/logo";
    } else if (type === "banner") {
      folder = "shopio/banners";
    }

    // ------------------------------------------------------------
    // Cloudinary resource type
    // ------------------------------------------------------------

    const resourceType = isVideo ? "video" : "image";

    // ------------------------------------------------------------
    // Convert File -> Buffer
    // ------------------------------------------------------------

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ------------------------------------------------------------
    // Upload to Cloudinary
    // ------------------------------------------------------------

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,

          // Let Cloudinary determine the correct format.
          // This works for a wide range of image/video formats.
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    // ------------------------------------------------------------
    // Return upload information
    // ------------------------------------------------------------

    return NextResponse.json({
      success: true,

      url: result.secure_url,

      public_id: result.public_id,

      resource_type: result.resource_type,

      format: result.format,

      original_filename: file.name,

      mime_type: mimeType,

      bytes: result.bytes,

      width: result.width,

      height: result.height,

      duration: result.duration || null,
    });
  } catch (error) {
    console.error("Settings Cloudinary upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload file",
      },
      { status: 500 }
    );
  }
}