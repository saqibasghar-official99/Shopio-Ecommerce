// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/mongodb';
// import { Order, SiteSettings } from '@/lib/models';
// import QRCode from 'qrcode';

// export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
//   try {
//     await connectDB();
//     const order = await Order.findOne({ order_number: params.orderNumber }).lean();
//     if (!order) {
//       return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
//     }

//     const settings = await SiteSettings.findOne().lean();
//     const storeName = settings?.store_name || 'Store';
//     const storeAddress = settings?.address || '';
//     const storePhone = settings?.phone || '';

//     // Generate QR code pointing to order tracking page
//     const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
//     const qrUrl = `${baseUrl}/order/${order.order_number}`;
//     const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 120, margin: 1 });

//     const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

//     const itemsSummary = (order.items || []).map((item: { name: string; qty: number }) => `${item.name} x${item.qty}`).join(', ');

//     const html = `<!DOCTYPE html>
// <html>
// <head>
//   <title>Shipping Label - ${order.order_number}</title>
//   <style>
//     @media print { body { margin: 0; } @page { size: 4in 6in; margin: 0; } }
//     body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; width: 4in; min-height: 6in; margin: 0 auto; padding: 16px; box-sizing: border-box; }
//   </style>
// </head>
// <body>
//   <div style="border: 2px solid #333; padding: 12px; height: 100%; box-sizing: border-box;">
//     <!-- From -->
//     <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
//       <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">From</p>
//       <p style="font-size: 13px; font-weight: bold; margin: 0;">${storeName}</p>
//       <p style="font-size: 10px; color: #666; margin: 2px 0;">${storeAddress}</p>
//       <p style="font-size: 10px; color: #666; margin: 2px 0;">${storePhone}</p>
//     </div>

//     <!-- To -->
//     <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
//       <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">Ship To</p>
//       <p style="font-size: 14px; font-weight: bold; margin: 0;">${order.customer_name}</p>
//       <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_address || ''}</p>
//       <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_city || ''}</p>
//       <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_phone || ''}</p>
//     </div>

//     <!-- Order info -->
//     <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
//       <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
//         <span style="font-size: 9px; text-transform: uppercase; color: #999;">Order</span>
//         <span style="font-size: 9px; text-transform: uppercase; color: #999;">Date</span>
//       </div>
//       <div style="display: flex; justify-content: space-between;">
//         <span style="font-size: 13px; font-weight: bold;">${order.order_number}</span>
//         <span style="font-size: 11px;">${fmtDate(order.created_at)}</span>
//       </div>
//     </div>

//     <!-- Items -->
//     <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
//       <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 4px 0;">Items</p>
//       <p style="font-size: 10px; margin: 0; line-height: 1.4;">${itemsSummary}</p>
//     </div>

//     <!-- Payment -->
//     <div style="margin-bottom: 8px;">
//       <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">Payment</p>
//       <p style="font-size: 11px; margin: 0; text-transform: capitalize;">${order.payment_method || '--'} &middot; <span style="text-transform: capitalize;">${order.payment_status || '--'}</span></p>
//     </div>

//     <!-- QR Code -->
//     <div style="text-align: center; margin-top: auto;">
//       <img src="${qrDataUrl}" alt="QR Code" style="width: 80px; height: 80px;" />
//       <p style="font-size: 8px; color: #999; margin: 4px 0 0 0;">Scan to track order</p>
//     </div>
//   </div>

//   <script>window.onload = function() { window.print(); }</script>
// </body>
// </html>`;

//     return new NextResponse(html, {
//       headers: { 'Content-Type': 'text/html' },
//     });
//   } catch (error) {
//     console.error('Shipping label error:', error);
//     return NextResponse.json({ success: false, message: 'Failed to generate shipping label' }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, SiteSettings } from '@/lib/models';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await connectDB();

    const order = await Order.findOne({
      order_number: params.orderNumber,
    }).lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    const settings = await SiteSettings.findOne().lean();

    const storeName = settings?.store_name || 'Store';
    const storeAddress = settings?.address || '';
    const storePhone = settings?.phone || '';

    // =========================================================
    // HELPERS
    // =========================================================

    const escapeHtml = (value: unknown) => {
      if (value === null || value === undefined) {
        return '';
      }

      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const clean = (value: unknown) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== '';

    // =========================================================
    // BILLING DETECTION
    // =========================================================

    const billingSameAsShipping =
      order.billing_same_as_shipping === true;

    const hasBillingData =
      clean(order.billing_name) ||
      clean(order.billing_phone) ||
      clean(order.billing_email) ||
      clean(order.billing_address) ||
      clean(order.billing_city) ||
      clean(order.billing_zone);

    const showBilling =
      !billingSameAsShipping && Boolean(hasBillingData);

    // =========================================================
    // QR CODE
    // =========================================================

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://example.com';

    const qrUrl = `${baseUrl}/order/${encodeURIComponent(
      order.order_number
    )}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 120,
      margin: 1,
    });

    // =========================================================
    // DATE
    // =========================================================

    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    // =========================================================
    // ITEMS
    // =========================================================

    const itemsSummary = (order.items || [])
      .map(
        (item: {
          name: string;
          qty: number;
          variant?: string;
        }) => {
          const variant = item.variant
            ? ` (${item.variant})`
            : '';

          return `${item.name}${variant} x${item.qty}`;
        }
      )
      .join(', ');

    // =========================================================
    // SHIPPING ADDRESS
    // =========================================================

    const shippingName = escapeHtml(
      order.customer_name || ''
    );

    const shippingPhone = escapeHtml(
      order.customer_phone || ''
    );

    const shippingEmail = escapeHtml(
      order.customer_email || ''
    );

    const shippingAddress = escapeHtml(
      order.customer_address || ''
    );

    const shippingCity = escapeHtml(
      order.customer_city || ''
    );

    const shippingZone = escapeHtml(
      order.delivery_zone || ''
    );

    // =========================================================
    // BILLING ADDRESS
    // =========================================================

    const billingName = escapeHtml(
      order.billing_name || ''
    );

    const billingPhone = escapeHtml(
      order.billing_phone || ''
    );

    const billingEmail = escapeHtml(
      order.billing_email || ''
    );

    const billingAddress = escapeHtml(
      order.billing_address || ''
    );

    const billingCity = escapeHtml(
      order.billing_city || ''
    );

    const billingZone = escapeHtml(
      order.billing_zone || ''
    );

    // =========================================================
    // BILLING HTML
    // =========================================================

    const billingSection = showBilling
      ? `
        <div class="address-card billing-card">

          <div class="address-header">
            <div>
              <div class="section-label">Bill To</div>
              <div class="address-title">
                Billing Address
              </div>
            </div>

            <span class="badge">
              Different
            </span>
          </div>

          <div class="address-content">

            ${
              billingName
                ? `
                  <div class="address-row">
                    <span class="field-label">Name</span>
                    <strong>${billingName}</strong>
                  </div>
                `
                : ''
            }

            ${
              billingPhone
                ? `
                  <div class="address-row">
                    <span class="field-label">Phone</span>
                    <strong>${billingPhone}</strong>
                  </div>
                `
                : ''
            }

            ${
              billingEmail
                ? `
                  <div class="address-row">
                    <span class="field-label">Email</span>
                    <strong class="break">
                      ${billingEmail}
                    </strong>
                  </div>
                `
                : ''
            }

            ${
              billingAddress
                ? `
                  <div class="address-row">
                    <span class="field-label">Address</span>
                    <strong>${billingAddress}</strong>
                  </div>
                `
                : ''
            }

            ${
              billingCity
                ? `
                  <div class="address-row">
                    <span class="field-label">City</span>
                    <strong>${billingCity}</strong>
                  </div>
                `
                : ''
            }

            ${
              billingZone
                ? `
                  <div class="address-row">
                    <span class="field-label">Zone</span>
                    <strong>${billingZone}</strong>
                  </div>
                `
                : ''
            }

          </div>
        </div>
      `
      : '';

    // =========================================================
    // ADDRESS GRID CLASS
    // =========================================================

    const addressGridClass = showBilling
      ? 'address-grid two-columns'
      : 'address-grid';

    // =========================================================
    // HTML
    // =========================================================

    const html = `<!DOCTYPE html>
<html>
<head>

  <meta charset="UTF-8" />

  <title>
    Shipping Label - ${escapeHtml(order.order_number)}
  </title>

  <style>

    @page {
      size: 6in 4in;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 6in;
      height: 4in;
    }

    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Arial,
        sans-serif;

      color: #222;
      background: #fff;

      width: 6in;
      height: 4in;

      padding: 0.12in;
    }

    .label {
      width: 100%;
      height: 100%;

      border: 2px solid #222;

      padding: 0.11in;

      display: flex;
      flex-direction: column;

      overflow: hidden;
    }

    /* =========================================================
       HEADER
       ========================================================= */

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      border-bottom: 1px solid #222;

      padding-bottom: 7px;
      margin-bottom: 7px;
    }

    .store-name {
      font-size: 16px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 3px;
    }

    .store-info {
      font-size: 8px;
      color: #555;
      line-height: 1.35;
    }

    .order-box {
      text-align: right;
    }

    .order-label {
      font-size: 7px;
      color: #777;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .order-number {
      font-size: 14px;
      font-weight: 800;
      margin-top: 2px;
    }

    .order-date {
      font-size: 8px;
      color: #555;
      margin-top: 2px;
    }

    /* =========================================================
       ADDRESSES
       ========================================================= */

    .address-grid {
      display: grid;
      grid-template-columns: 1fr;

      gap: 7px;

      margin-bottom: 7px;
    }

    .address-grid.two-columns {
      grid-template-columns: 1fr 1fr;
    }

    .address-card {
      border: 1px solid #ccc;
      border-radius: 3px;

      padding: 7px;

      min-width: 0;
    }

    .billing-card {
      border-color: #9db9d8;
    }

    .address-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      border-bottom: 1px dashed #ccc;

      padding-bottom: 4px;
      margin-bottom: 5px;
    }

    .section-label {
      font-size: 7px;
      color: #777;

      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .address-title {
      font-size: 10px;
      font-weight: 800;
      margin-top: 1px;
    }

    .badge {
      display: inline-block;

      background: #e8f1fb;
      color: #2563a8;

      border-radius: 20px;

      padding: 2px 5px;

      font-size: 6px;
      font-weight: 700;

      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .address-content {
      display: grid;
      grid-template-columns: 1fr 1fr;

      column-gap: 8px;
      row-gap: 3px;
    }

    .address-row {
      min-width: 0;
    }

    .field-label {
      display: block;

      color: #888;

      font-size: 6.5px;

      text-transform: uppercase;
      letter-spacing: 0.3px;

      margin-bottom: 1px;
    }

    .address-row strong {
      display: block;

      font-size: 8px;
      line-height: 1.2;

      font-weight: 600;

      word-break: break-word;
    }

    .break {
      word-break: break-all;
    }

    /* =========================================================
       BOTTOM INFORMATION
       ========================================================= */

    .bottom-grid {
      display: grid;

      grid-template-columns: 1fr 1fr 0.65fr;

      gap: 7px;

      flex: 1;

      min-height: 0;
    }

    .info-card {
      border-top: 1px dashed #ccc;

      padding-top: 6px;

      min-width: 0;
    }

    .info-title {
      font-size: 7px;

      color: #777;

      text-transform: uppercase;

      letter-spacing: 0.5px;

      margin-bottom: 3px;
    }

    .items {
      font-size: 7.5px;

      line-height: 1.3;

      color: #333;

      max-height: 45px;

      overflow: hidden;
    }

    .payment {
      font-size: 8px;

      font-weight: 600;

      text-transform: capitalize;

      line-height: 1.4;
    }

    .total {
      font-size: 12px;

      font-weight: 800;

      margin-top: 3px;
    }

    .qr-box {
      text-align: center;

      border-left: 1px dashed #ccc;

      padding-left: 7px;
    }

    .qr-box img {
      width: 55px;
      height: 55px;

      display: block;

      margin: 0 auto 2px;
    }

    .qr-text {
      font-size: 6px;

      color: #888;

      line-height: 1.2;
    }

    /* =========================================================
       PRINT
       ========================================================= */

    @media print {

      html,
      body {
        width: 6in;
        height: 4in;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .label {
        width: 6in;
        height: 4in;
      }

    }

  </style>

</head>

<body>

  <div class="label">

    <!-- =====================================================
         STORE HEADER
         ===================================================== -->

    <div class="header">

      <div>

        <div class="store-name">
          ${escapeHtml(storeName)}
        </div>

        <div class="store-info">
          ${escapeHtml(storeAddress)}
          ${
            storePhone
              ? ` &nbsp;•&nbsp; ${escapeHtml(storePhone)}`
              : ''
          }
        </div>

      </div>

      <div class="order-box">

        <div class="order-label">
          Order
        </div>

        <div class="order-number">
          ${escapeHtml(order.order_number)}
        </div>

        <div class="order-date">
          ${fmtDate(order.created_at)}
        </div>

      </div>

    </div>


    <!-- =====================================================
         SHIPPING + BILLING
         ===================================================== -->

    <div class="${addressGridClass}">

      <!-- SHIPPING -->

      <div class="address-card">

        <div class="address-header">

          <div>

            <div class="section-label">
              Ship To
            </div>

            <div class="address-title">
              Shipping Address
            </div>

          </div>

          <span class="badge">
            Delivery
          </span>

        </div>

        <div class="address-content">

          ${
            shippingName
              ? `
                <div class="address-row">
                  <span class="field-label">
                    Name
                  </span>
                  <strong>
                    ${shippingName}
                  </strong>
                </div>
              `
              : ''
          }

          ${
            shippingPhone
              ? `
                <div class="address-row">
                  <span class="field-label">
                    Phone
                  </span>
                  <strong>
                    ${shippingPhone}
                  </strong>
                </div>
              `
              : ''
          }

          ${
            shippingEmail
              ? `
                <div class="address-row">
                  <span class="field-label">
                    Email
                  </span>
                  <strong class="break">
                    ${shippingEmail}
                  </strong>
                </div>
              `
              : ''
          }

          ${
            shippingAddress
              ? `
                <div class="address-row">
                  <span class="field-label">
                    Address
                  </span>
                  <strong>
                    ${shippingAddress}
                  </strong>
                </div>
              `
              : ''
          }

          ${
            shippingCity
              ? `
                <div class="address-row">
                  <span class="field-label">
                    City
                  </span>
                  <strong>
                    ${shippingCity}
                  </strong>
                </div>
              `
              : ''
          }

          ${
            shippingZone
              ? `
                <div class="address-row">
                  <span class="field-label">
                    Zone
                  </span>
                  <strong>
                    ${shippingZone}
                  </strong>
                </div>
              `
              : ''
          }

        </div>

      </div>


      <!-- BILLING -->

      ${billingSection}

    </div>


    <!-- =====================================================
         BOTTOM INFORMATION
         ===================================================== -->

    <div class="bottom-grid">

      <!-- ITEMS -->

      <div class="info-card">

        <div class="info-title">
          Items
        </div>

        <div class="items">
          ${escapeHtml(itemsSummary || '--')}
        </div>

      </div>


      <!-- PAYMENT -->

      <div class="info-card">

        <div class="info-title">
          Payment
        </div>

        <div class="payment">
          ${escapeHtml(
            order.payment_method || '--'
          )}
          &nbsp;•&nbsp;
          ${escapeHtml(
            order.payment_status || '--'
          )}
        </div>

        <div class="total">
          ${escapeHtml(
            String(order.total ?? 0)
          )}
        </div>

      </div>


      <!-- QR -->

      <div class="info-card qr-box">

        <img
          src="${qrDataUrl}"
          alt="QR Code"
        />

        <div class="qr-text">
          Scan to track order
        </div>

      </div>

    </div>

  </div>


  <script>
    window.onload = function () {
      window.print();
    };
  </script>

</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error(
      'Shipping label error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to generate shipping label',
      },
      { status: 500 }
    );
  }
}