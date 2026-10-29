import mongoose from 'mongoose';
import { Order, Product, SellerAuditLog, SellerCommission, SellerProgram } from '@/lib/models';

const SELLER_COMMISSION_RATE = 15;

export async function getSellerProgram() {
  return SellerProgram.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default', monthly_sales_threshold: 3, monthly_gift_limit: 2, default_commission_rate: SELLER_COMMISSION_RATE } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function createSellerCommission(order: {
  _id: mongoose.Types.ObjectId;
  order_number: string;
  seller_order?: boolean;
  seller_id?: mongoose.Types.ObjectId | null;
  items: Array<{
    productId: string;
    unitPrice: number;
    originalUnitPrice?: number;
    sellerProfit?: number;
    qty: number;
  }>;
  subtotal: number;
  discount: number;
  bank_transfer_discount?: number;
}) {
  if (!order.seller_id) return;

  if (order.seller_order && order.items.some(
    (item) => Number(item.unitPrice) > Number(item.originalUnitPrice ?? item.unitPrice)
  )) return;

  const ids = order.items
    .map((item) => item.productId)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  const products = await Product.find({ _id: { $in: ids } }).select('_id price category_id').lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  const lines = order.items.flatMap((item) => {
    const product = productsById.get(item.productId);
    const qty = Number(item.qty);
    if (!product || !Number.isInteger(qty) || qty < 1) return [];
    const unitPrice = order.seller_order
      ? Number(item.originalUnitPrice ?? product.price)
      : Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return [];
    return [{ value: unitPrice * qty }];
  });
  const gross = lines.reduce((sum, line) => sum + line.value, 0);
  const discount = Math.max(0, Number(order.discount || 0) + Number(order.bank_transfer_discount || 0));
  const buyerNetMerchandise = Math.max(0, Number(order.subtotal) - discount);
  const eligibleAmount = Math.min(gross, buyerNetMerchandise);
  const amount = Number((eligibleAmount * SELLER_COMMISSION_RATE / 100).toFixed(2));
  await SellerCommission.updateOne(
    { order_id: order._id },
    {
      $setOnInsert: {
        seller_id: order.seller_id,
        order_id: order._id,
        order_number: order.order_number,
        earning_type: 'commission',
        eligible_amount: Number(eligibleAmount.toFixed(2)),
        amount: Number(amount.toFixed(2)),
        original_amount: Number(amount.toFixed(2)),
        rate: eligibleAmount > 0 ? SELLER_COMMISSION_RATE : 0,
        status: 'pending',
      },
    },
    { upsert: true }
  );
}

export async function createSellerProfitLedger(order: {
  _id: mongoose.Types.ObjectId;
  order_number: string;
  seller_id?: mongoose.Types.ObjectId | null;
  subtotal: number;
  items: Array<{
    sellerProfit?: number;
    originalUnitPrice?: number;
    unitPrice?: number;
    qty: number;
  }>;
}) {
  if (!order.seller_id) return;
  const profit = order.items.reduce(
    (sum, item) => {
      const unitProfit = item.originalUnitPrice === undefined
        ? Number(item.sellerProfit || 0)
        : Math.max(0, Number(item.unitPrice || 0) - Number(item.originalUnitPrice));
      return sum + unitProfit * Number(item.qty || 0);
    },
    0
  );
  if (!Number.isFinite(profit) || profit <= 0) return;
  const eligibleAmount = Math.max(0, Number(order.subtotal || 0));
  await SellerCommission.updateOne(
    { order_id: order._id },
    {
      $setOnInsert: {
        seller_id: order.seller_id,
        order_id: order._id,
        order_number: order.order_number,
        earning_type: 'profit',
        eligible_amount: Number(eligibleAmount.toFixed(2)),
        amount: Number(profit.toFixed(2)),
        original_amount: Number(profit.toFixed(2)),
        rate: eligibleAmount > 0 ? Number((profit / eligibleAmount * 100).toFixed(4)) : 0,
        status: 'pending',
      },
    },
    { upsert: true }
  );
}

export async function reconcileSellerCommission(orderId: mongoose.Types.ObjectId | string) {
  const order = await Order.findById(orderId).select('order_status payment_status refunded_amount');
  if (!order) return;
  const commission = await SellerCommission.findOne({ order_id: order._id });
  if (!commission) return;

  const refundedAmount = Math.max(0, order.refunded_amount || 0);
  const isRefundedOrCancelled = order.order_status === 'cancelled' || order.payment_status === 'failed' || order.payment_status === 'refunded' || refundedAmount > 0;
  if (commission.status === 'paid') {
    if (isRefundedOrCancelled) {
      commission.status = 'disputed';
      await commission.save();
      await SellerAuditLog.create({
        actor: 'system',
        action: 'seller.paid_commission_disputed',
        target_type: 'seller_commission',
        target_id: commission.id,
        details: { order_id: String(order._id), refunded_amount: refundedAmount },
      });
    }
    return;
  }
  if (commission.status === 'disputed') return;

  const originalAmount = commission.original_amount ?? commission.amount;
  const isFullyRefunded = commission.eligible_amount > 0 && refundedAmount >= commission.eligible_amount;
  let status: 'pending' | 'available' | 'reversed' = 'pending';
  if (order.order_status === 'cancelled' || order.payment_status === 'failed' || order.payment_status === 'refunded' || isFullyRefunded) {
    status = 'reversed';
  } else if (order.order_status === 'delivered' && order.payment_status === 'paid') {
    status = 'available';
  }
  const refundRatio = commission.eligible_amount > 0
    ? Math.min(1, refundedAmount / commission.eligible_amount)
    : 0;
  const adjustedAmount = Number((originalAmount * (1 - refundRatio)).toFixed(2));
  if (commission.status !== status || commission.amount !== adjustedAmount) {
    commission.status = status;
    commission.amount = adjustedAmount;
    await commission.save();
  }
}

export async function restoreSellerOrderStock(orderId: mongoose.Types.ObjectId | string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        { _id: orderId, seller_order: true, seller_stock_restored: { $ne: true } },
        { $set: { seller_stock_restored: true } },
        { new: true, session }
      ).select('items');
      if (!order) return;
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.qty } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
}

export function getKarachiMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

export async function getQualifyingOrderCount(sellerId: mongoose.Types.ObjectId | string, monthKey?: string) {
  const query = {
    seller_id: sellerId,
    order_status: 'delivered',
    payment_status: 'paid',
    $expr: {
      $lt: [
        { $ifNull: ['$refunded_amount', 0] },
        {
          $max: [
            0,
            {
              $subtract: [
                { $subtract: [{ $ifNull: ['$subtotal', 0] }, { $ifNull: ['$discount', 0] }] },
                { $ifNull: ['$bank_transfer_discount', 0] },
              ],
            },
          ],
        },
      ],
    },
  };
  if (!monthKey) return Order.countDocuments(query);

  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const localStart = new Date(`${monthKey}-01T00:00:00+05:00`);
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
  const localEnd = new Date(`${nextMonth}-01T00:00:00+05:00`);
  return Order.countDocuments({
    ...query,
    created_at: { $gte: localStart, $lt: localEnd },
  });
}
