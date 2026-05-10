import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, SiteSettings } from '@/lib/models';
import QRCode from 'qrcode';

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    await connectDB();
    const order = await Order.findOne({ order_number: params.orderNumber }).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const settings = await SiteSettings.findOne().lean();
    const storeName = settings?.store_name || 'Store';
    const storeAddress = settings?.address || '';
    const storePhone = settings?.phone || '';

    // Generate QR code pointing to order tracking page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const qrUrl = `${baseUrl}/order/${order.order_number}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 120, margin: 1 });

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const itemsSummary = (order.items || []).map((item: { name: string; qty: number }) => `${item.name} x${item.qty}`).join(', ');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label - ${order.order_number}</title>
  <style>
    @media print { body { margin: 0; } @page { size: 4in 6in; margin: 0; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; width: 4in; min-height: 6in; margin: 0 auto; padding: 16px; box-sizing: border-box; }
  </style>
</head>
<body>
  <div style="border: 2px solid #333; padding: 12px; height: 100%; box-sizing: border-box;">
    <!-- From -->
    <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
      <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">From</p>
      <p style="font-size: 13px; font-weight: bold; margin: 0;">${storeName}</p>
      <p style="font-size: 10px; color: #666; margin: 2px 0;">${storeAddress}</p>
      <p style="font-size: 10px; color: #666; margin: 2px 0;">${storePhone}</p>
    </div>

    <!-- To -->
    <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
      <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">Ship To</p>
      <p style="font-size: 14px; font-weight: bold; margin: 0;">${order.customer_name}</p>
      <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_address || ''}</p>
      <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_city || ''}</p>
      <p style="font-size: 11px; color: #333; margin: 2px 0;">${order.customer_phone || ''}</p>
    </div>

    <!-- Order info -->
    <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 9px; text-transform: uppercase; color: #999;">Order</span>
        <span style="font-size: 9px; text-transform: uppercase; color: #999;">Date</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 13px; font-weight: bold;">${order.order_number}</span>
        <span style="font-size: 11px;">${fmtDate(order.created_at)}</span>
      </div>
    </div>

    <!-- Items -->
    <div style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px;">
      <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 4px 0;">Items</p>
      <p style="font-size: 10px; margin: 0; line-height: 1.4;">${itemsSummary}</p>
    </div>

    <!-- Payment -->
    <div style="margin-bottom: 8px;">
      <p style="font-size: 9px; text-transform: uppercase; color: #999; margin: 0 0 2px 0;">Payment</p>
      <p style="font-size: 11px; margin: 0; text-transform: capitalize;">${order.payment_method || '--'} &middot; <span style="text-transform: capitalize;">${order.payment_status || '--'}</span></p>
    </div>

    <!-- QR Code -->
    <div style="text-align: center; margin-top: auto;">
      <img src="${qrDataUrl}" alt="QR Code" style="width: 80px; height: 80px;" />
      <p style="font-size: 8px; color: #999; margin: 4px 0 0 0;">Scan to track order</p>
    </div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Shipping label error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate shipping label' }, { status: 500 });
  }
}
