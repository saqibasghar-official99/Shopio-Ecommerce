import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import * as XLSX from "xlsx";

import { Product, Category } from '@/lib/models';
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type ImportRow = Record<string, unknown>;

interface ImportError {
  row: number;
  name: string;
  error: string;
}

interface ImportResults {
  total: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

/* =========================================================
   DATABASE
========================================================= */

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not configured."
    );
  }

  await mongoose.connect(
    process.env.MONGODB_URI
  );
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeHeader(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getValue(
  row: ImportRow,
  key: string
): string {
  const wanted =
    normalizeHeader(key);

  const actualKey =
    Object.keys(row).find(
      (rowKey) =>
        normalizeHeader(rowKey) ===
        wanted
    );

  if (!actualKey) {
    return "";
  }

  const value =
    row[actualKey];

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function getDynamicValue(
  row: ImportRow,
  prefix: string,
  number: number,
  suffix: string
): string {
  return getValue(
    row,
    `${prefix} ${number} ${suffix}`
  );
}

function parseNumber(
  value: string,
  defaultValue = 0
): number {
  if (!value.trim()) {
    return defaultValue;
  }

  const cleaned =
    value.replace(
      /[^0-9.-]/g,
      ""
    );

  const parsed =
    Number(cleaned);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : defaultValue;
}

function parseInteger(
  value: string,
  defaultValue = 0
): number {
  if (!value.trim()) {
    return defaultValue;
  }

  const cleaned =
    value.replace(
      /[^0-9.-]/g,
      ""
    );

  const parsed =
    parseInt(cleaned, 10);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : defaultValue;
}

function parseBoolean(
  value: string,
  defaultValue: boolean
): boolean {
  if (!value.trim()) {
    return defaultValue;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "y",
      "on",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
      "off",
    ].includes(normalized)
  ) {
    return false;
  }

  return defaultValue;
}

function slugifyValue(
  value: string
): string {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function parseTags(
  value: string
): string[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((tag) =>
      tag.trim()
    )
    .filter(Boolean);
}

/* =========================================================
   SPECIFICATIONS
   Example:

   Material: 925 Silver | Color: Black | Type: Stud Earrings
========================================================= */

function parseSpecifications(
  value: string
): {
  key: string;
  value: string;
}[] {
  if (!value.trim()) {
    return [];
  }

  const specifications: {
    key: string;
    value: string;
  }[] = [];

  const parts =
    value.split("|");

  for (const part of parts) {
    const trimmed =
      part.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex =
      trimmed.indexOf(":");

    if (
      separatorIndex === -1
    ) {
      continue;
    }

    const key =
      trimmed
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const specValue =
      trimmed
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (
      key &&
      specValue
    ) {
      specifications.push({
        key,
        value: specValue,
      });
    }
  }

  return specifications;
}

/* =========================================================
   VARIANTS

   Variant 1 Label
   Variant 1 Options

   Variant 2 Label
   Variant 2 Options

   etc.
========================================================= */

function parseVariants(
  row: ImportRow
): {
  label: string;
  options: string[];
}[] {
  const variants: {
    label: string;
    options: string[];
  }[] = [];

  for (
    let i = 1;
    i <= 50;
    i++
  ) {
    const label =
      getDynamicValue(
        row,
        "Variant",
        i,
        "Label"
      );

    const optionsValue =
      getDynamicValue(
        row,
        "Variant",
        i,
        "Options"
      );

    if (
      !label &&
      !optionsValue
    ) {
      continue;
    }

    const options =
      optionsValue
        .split(",")
        .map((option) =>
          option.trim()
        )
        .filter(Boolean);

    if (
      label &&
      options.length > 0
    ) {
      variants.push({
        label,
        options,
      });
    }
  }

  return variants;
}

/* =========================================================
   CATEGORY
========================================================= */

async function findCategory(
  categoryValue: string
) {
  if (!categoryValue.trim()) {
    return null;
  }

  const normalized =
    categoryValue
      .trim()
      .toLowerCase();

  const category =
    await Category.findOne({
      $or: [
        {
          name: {
            $regex: `^${escapeRegex(
              categoryValue.trim()
            )}$`,
            $options:
              "i",
          },
        },
        {
          slug: normalized,
        },
      ],
    }).lean();

  return category;
}

function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* =========================================================
   IMAGE URL CHECK
========================================================= */

function isCloudinaryUrl(
  url: string
): boolean {
  return (
    url.includes(
      "res.cloudinary.com/"
    ) &&
    url.includes(
      "/image/upload/"
    )
  );
}

/* =========================================================
   CLOUDINARY IMAGE IMPORT

   Cloudinary can fetch a public remote image URL
   directly, so we don't need to download it manually.
========================================================= */

async function uploadRemoteImage(
  imageUrl: string,
  productSlug: string,
  imageIndex: number
): Promise<string> {
  if (
    isCloudinaryUrl(imageUrl)
  ) {
    return imageUrl;
  }

  if (
    !imageUrl.startsWith(
      "https://"
    ) &&
    !imageUrl.startsWith(
      "http://"
    )
  ) {
    throw new Error(
      `Invalid image URL: ${imageUrl}`
    );
  }

  try {
    const result =
      await cloudinary.uploader.upload(
        imageUrl,
        {
          folder:
            "shopio/products",
          public_id: `${productSlug}-${imageIndex}-${Date.now()}`,
          resource_type:
            "image",
        }
      );

    return result.secure_url;
  } catch (error) {
    console.error(
      "Cloudinary image upload failed:",
      imageUrl,
      error
    );

    throw new Error(
      `Failed to upload image to Cloudinary: ${imageUrl}`
    );
  }
}

/* =========================================================
   GET IMAGE URLS
========================================================= */

function getImageUrls(
  row: ImportRow
): string[] {
  const images: string[] = [];

  for (
    let i = 1;
    i <= 5;
    i++
  ) {
    const image =
      getValue(
        row,
        `Image ${i}`
      );

    if (image) {
      images.push(image);
    }
  }

  return images.slice(
    0,
    5
  );
}

/* =========================================================
   DOWNLOAD SPREADSHEET FROM URL
========================================================= */

async function downloadSpreadsheetFromUrl(
  url: string
): Promise<Buffer> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      "Invalid spreadsheet URL."
    );
  }

  if (
    parsedUrl.protocol !==
      "https:" &&
    parsedUrl.protocol !==
      "http:"
  ) {
    throw new Error(
      "Only HTTP and HTTPS spreadsheet URLs are supported."
    );
  }

  const hostname =
    parsedUrl.hostname.toLowerCase();

  const isOneDrive =
    hostname === "1drv.ms" ||
    hostname.endsWith(
      ".onedrive.live.com"
    ) ||
    hostname ===
      "onedrive.live.com";

  const looksLikeSpreadsheet =
    /\.(xlsx?|csv)$/i.test(
      parsedUrl.pathname
    );

  if (
    !isOneDrive &&
    !looksLikeSpreadsheet
  ) {
    throw new Error(
      "URL must be a public OneDrive Excel link or a direct CSV/XLS/XLSX URL."
    );
  }

  const urlsToTry: string[] = [
    url,
  ];

  /*
   * For OneDrive links, try ?download=1.
   * This helps when the shared URL redirects to
   * the Excel web viewer.
   */
  if (isOneDrive) {
    const downloadUrl =
      new URL(url);

    downloadUrl.searchParams.set(
      "download",
      "1"
    );

    urlsToTry.push(
      downloadUrl.toString()
    );
  }

  let lastError =
    "Unable to download spreadsheet.";

  for (const targetUrl of urlsToTry) {
    try {
      const response =
        await fetch(
          targetUrl,
          {
            method: "GET",
            redirect: "follow",
            headers: {
              Accept:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/octet-stream,*/*",
              "User-Agent":
                "Shopio-Bulk-Importer/1.0",
            },
            cache: "no-store",
          }
        );

      if (!response.ok) {
        lastError =
          `Spreadsheet download failed with HTTP ${response.status}.`;
        continue;
      }

      const buffer =
        Buffer.from(
          await response.arrayBuffer()
        );

      if (
        buffer.length === 0
      ) {
        lastError =
          "Downloaded spreadsheet is empty.";
        continue;
      }

      const contentType =
        (
          response.headers.get(
            "content-type"
          ) || ""
        ).toLowerCase();

      /*
       * XLSX/XLS files are binary.
       * XLSX is ZIP-based and starts with PK.
       * XLS uses D0 CF 11 CF.
       *
       * CSV is text.
       */
      const firstBytes =
        buffer.subarray(
          0,
          8
        );

      const isZip =
        firstBytes[0] ===
          0x50 &&
        firstBytes[1] ===
          0x4b;

      const isOldExcel =
        firstBytes[0] ===
          0xd0 &&
        firstBytes[1] ===
          0xcf &&
        firstBytes[2] ===
          0x11 &&
        firstBytes[3] ===
          0xe0;

      const isHtml =
        contentType.includes(
          "text/html"
        );

      if (
        !isHtml &&
        (isZip ||
          isOldExcel ||
          contentType.includes(
            "spreadsheet"
          ) ||
          contentType.includes(
            "excel"
          ) ||
          contentType.includes(
            "csv"
          ) ||
          contentType.includes(
            "octet-stream"
          ))
      ) {
        return buffer;
      }

      /*
       * Sometimes the server returns a CSV even
       * with text/plain.
       */
      const preview =
        buffer
          .subarray(
            0,
            Math.min(
              buffer.length,
              500
            )
          )
          .toString(
            "utf8"
          )
          .trim();

      if (
        !isHtml &&
        (
          preview.includes(
            ","
          ) ||
          preview.includes(
            "\t"
          )
        )
      ) {
        return buffer;
      }

      lastError =
        "The URL returned a web page instead of the actual spreadsheet file.";
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Failed to download spreadsheet.";
    }
  }

  throw new Error(
    lastError
  );
}

/* =========================================================
   READ WORKBOOK
========================================================= */

function parseSpreadsheet(
  buffer: Buffer,
  fileName = ""
): ImportRow[] {
  const workbook =
    XLSX.read(
      buffer,
      {
        type: "buffer",
        cellDates: false,
        cellNF: false,
        cellText: true,
      }
    );

  if (
    !workbook.SheetNames.length
  ) {
    throw new Error(
      "Spreadsheet does not contain any worksheet."
    );
  }

  /*
   * First worksheet is used.
   */
  const firstSheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  if (!firstSheet) {
    throw new Error(
      "Unable to read the first worksheet."
    );
  }

  const rows =
    XLSX.utils.sheet_to_json(
      firstSheet,
      {
        defval: "",
        raw: false,
      }
    ) as ImportRow[];

  if (!rows.length) {
    throw new Error(
      "Spreadsheet contains no product rows."
    );
  }

  return rows;
}

/* =========================================================
   PRODUCT IMPORT
========================================================= */

async function importProduct(
  row: ImportRow,
  rowNumber: number
) {
  const name =
    getValue(row, "Name");

  const categoryValue =
    getValue(
      row,
      "Category"
    );

  const priceValue =
    getValue(
      row,
      "Price"
    );

  if (!name) {
    throw new Error(
      "Name is required."
    );
  }

  if (!categoryValue) {
    throw new Error(
      "Category is required."
    );
  }

  if (!priceValue) {
    throw new Error(
      "Price is required."
    );
  }

  const price =
    parseNumber(
      priceValue,
      NaN
    );

  if (!Number.isFinite(price)) {
    throw new Error(
      "Price must be a valid number."
    );
  }

  const category =
    await findCategory(
      categoryValue
    );

  if (!category) {
    throw new Error(
      `Category "${categoryValue}" was not found.`
    );
  }

  const providedSlug =
    getValue(
      row,
      "Slug"
    );

  const slug =
    providedSlug
      ? slugifyValue(
          providedSlug
        )
      : slugifyValue(name);

  if (!slug) {
    throw new Error(
      "Unable to generate a valid slug."
    );
  }

  /*
   * Do not silently create duplicate products.
   */
  const existing =
    await Product.findOne({
      slug,
    }).select(
      "_id name slug"
    );

  if (existing) {
    throw new Error(
      `Slug "${slug}" already exists for product "${existing.name}".`
    );
  }

  const rawImages =
    getImageUrls(row);

  const uploadedImages: string[] =
    [];

  /*
   * Upload images sequentially.
   * This avoids sending many simultaneous
   * Cloudinary requests for a single row.
   */
  for (
    let i = 0;
    i < rawImages.length;
    i++
  ) {
    const uploaded =
      await uploadRemoteImage(
        rawImages[i],
        slug,
        i + 1
      );

    uploadedImages.push(
      uploaded
    );
  }

  const description =
    getValue(
      row,
      "Description"
    );

  const shortDescription =
    getValue(
      row,
      "Short Description"
    );

  const comparePrice =
    parseNumber(
      getValue(
        row,
        "Compare Price"
      ),
      0
    );

  const cost =
    parseNumber(
      getValue(
        row,
        "Cost"
      ),
      0
    );

  const stock =
    parseInteger(
      getValue(
        row,
        "Stock"
      ),
      0
    );

  const weight =
    parseNumber(
      getValue(
        row,
        "Weight"
      ),
      0
    );

  const sku =
    getValue(
      row,
      "SKU"
    );

  const badge =
    getValue(
      row,
      "Badge"
    );

  const featured =
    parseBoolean(
      getValue(
        row,
        "Featured"
      ),
      false
    );

  const active =
    parseBoolean(
      getValue(
        row,
        "Active"
      ),
      true
    );

  const tags =
    parseTags(
      getValue(
        row,
        "Tags"
      )
    );

  const specifications =
    parseSpecifications(
      getValue(
        row,
        "Specifications"
      )
    );

  const variants =
    parseVariants(row);

  const product =
    await Product.create({
      name,
      slug,
      description,
      short_description:
        shortDescription,

      category_id:
        category._id,

      price,

      compare_price:
        comparePrice,

      cost,

      images:
        uploadedImages,

      stock,

      sku,

      weight,

      badge,

      is_active:
        active,

      is_featured:
        featured,

      tags,

      specifications,

      variants,

      ratings_avg: 0,
      ratings_count: 0,
    });

  return product;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const urlValue =
      formData.get("url");

    let rows: ImportRow[] = [];

    /*
     * ==========================================
     * MODE 1: UPLOADED FILE
     * ==========================================
     */

    if (
      file &&
      file instanceof File
    ) {
      const fileName =
        file.name || "";

      const extension =
        fileName
          .split(".")
          .pop()
          ?.toLowerCase();

      if (
        ![
          "csv",
          "xlsx",
          "xls",
        ].includes(
          extension || ""
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Only CSV, XLSX and XLS files are supported.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * 10 MB maximum uploaded spreadsheet.
       */
      if (
        file.size >
        10 * 1024 * 1024
      ) {
        return NextResponse.json(
          {
            message:
              "Spreadsheet file is too large. Maximum size is 10 MB.",
          },
          {
            status: 400,
          }
        );
      }

      const buffer =
        Buffer.from(
          await file.arrayBuffer()
        );

      rows =
        parseSpreadsheet(
          buffer,
          fileName
        );
    }

    /*
     * ==========================================
     * MODE 2: ONLINE EXCEL URL
     * ==========================================
     */

    else if (
      typeof urlValue ===
        "string" &&
      urlValue.trim()
    ) {
      const url =
        urlValue.trim();

      const buffer =
        await downloadSpreadsheetFromUrl(
          url
        );

      rows =
        parseSpreadsheet(
          buffer,
          url
        );
    }

    /*
     * ==========================================
     * NOTHING PROVIDED
     * ==========================================
     */

    else {
      return NextResponse.json(
        {
          message:
            "Please upload a CSV/Excel file or provide an Excel URL.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prevent accidental huge imports.
     */
    if (
      rows.length > 500
    ) {
      return NextResponse.json(
        {
          message:
            "Maximum 500 products can be imported at once.",
        },
        {
          status: 400,
        }
      );
    }

    const results: ImportResults =
      {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

    /*
     * Import each row independently.
     *
     * If one product fails, the next product
     * continues importing.
     */
    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row =
        rows[index];

      const rowNumber =
        index + 2;

      const name =
        getValue(
          row,
          "Name"
        );

      try {
        await importProduct(
          row,
          rowNumber
        );

        results.successful++;
      } catch (error) {
        results.failed++;

        results.errors.push({
          row: rowNumber,
          name,
          error:
            error instanceof
            Error
              ? error.message
              : "Unknown import error.",
        });
      }
    }

    return NextResponse.json(
      {
        success:
          results.failed === 0,
        message:
          results.failed ===
          0
            ? "All products imported successfully."
            : "Import completed with some errors.",
        results,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "BULK IMPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
          Error
            ? error.message
            : "Bulk import failed.",
      },
      {
        status: 500,
      }
    );
  }
}