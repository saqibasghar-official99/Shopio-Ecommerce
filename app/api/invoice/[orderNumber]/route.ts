import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, SiteSettings } from '@/lib/models';

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
    const currency = settings?.currency || '$';

    const fmtPrice = (n: number) => `${currency}${n.toFixed(2)}`;
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const itemsHtml = (order.items || []).map((item: { name: string; qty: number; unitPrice: number }, i: number) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 12px; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px 12px; font-size: 13px;">${item.name}</td>
        <td style="padding: 8px 12px; font-size: 13px; text-align: center;">${item.qty}</td>
        <td style="padding: 8px 12px; font-size: 13px; text-align: right;">${fmtPrice(item.unitPrice)}</td>
        <td style="padding: 8px 12px; font-size: 13px; text-align: right;">${fmtPrice(item.unitPrice * item.qty)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f8f8; text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
    <div>
      <h1 style="font-size: 24px; margin: 0; color: #16a34a;">${storeName}</h1>
      <p style="font-size: 12px; color: #666; margin-top: 4px;">${storeAddress}<br/>${storePhone}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="font-size: 20px; margin: 0; color: #333;">INVOICE</h2>
      <p style="font-size: 12px; color: #666; margin-top: 4px;">#${order.order_number}<br/>${fmtDate(order.created_at)}</p>
    </div>
  </div>

  <div style="display: flex; gap: 40px; margin-bottom: 30px;">
    <div style="flex: 1;">
      <h3 style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px;">Bill To</h3>
      <p style="font-size: 13px; margin: 0;">${order.customer_name}</p>
      <p style="font-size: 12px; color: #666; margin: 2px 0;">${order.customer_email || ''}</p>
      <p style="font-size: 12px; color: #666; margin: 2px 0;">${order.customer_phone || ''}</p>
      <p style="font-size: 12px; color: #666; margin: 2px 0;">${order.customer_address || ''}${order.customer_city ? ', ' + order.customer_city : ''}</p>
    </div>
    <div style="flex: 1; text-align: right;">
      <h3 style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px;">Payment</h3>
      <p style="font-size: 13px; margin: 0; text-transform: capitalize;">${order.payment_method || '--'}</p>
      <p style="font-size: 12px; color: #666; margin: 2px 0;">Status: <span style="text-transform: capitalize;">${order.payment_status || '--'}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Item</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
    <div style="width: 250px;">
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;">
        <span style="color: #666;">Subtotal</span><span>${fmtPrice(order.subtotal)}</span>
      </div>
      ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;"><span style="color: #666;">Discount</span><span style="color: #16a34a;">-${fmtPrice(order.discount)}</span></div>` : ''}
      ${order.delivery_fee > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;"><span style="color: #666;">Delivery</span><span>${fmtPrice(order.delivery_fee)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold; border-top: 2px solid #333; margin-top: 8px;">
        <span>Total</span><span style="color: #16a34a;">${fmtPrice(order.total)}</span>
      </div>
    </div>
  </div>

  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
    Thank you for your purchase!
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Invoice error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate invoice' }, { status: 500 });
  }
}
