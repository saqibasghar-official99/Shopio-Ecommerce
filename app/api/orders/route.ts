import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import {
  Order,
  Customer,
  Coupon,
  DeliveryZone,
  Product,
  Seller,
  SellerCommission,
} from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { getSellerFromRequest } from '@/lib/seller-auth';
import cloudinary from '@/lib/cloudinary';
import { createSellerCommission, createSellerProfitLedger } from '@/lib/server/sellers';

// =========================================================
// GET /api/orders
// Admin: list orders with filters
// =========================================================

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const payment_status =
      searchParams.get('payment_status');

    const search = searchParams.get('search');

    const dateFrom =
      searchParams.get('date_from');

    const dateTo =
      searchParams.get('date_to');

    const page = parseInt(
      searchParams.get('page') || '1',
      10
    );

    const limit = parseInt(
      searchParams.get('limit') || '20',
      10
    );

    const filter: Record<string, unknown> = {};

    // --------------------------------------------------
    // Status filter
    // --------------------------------------------------

    if (status) {
      filter.order_status = status;
    }

    // --------------------------------------------------
    // Payment status filter
    // --------------------------------------------------

    if (payment_status) {
      filter.payment_status = payment_status;
    }

    // --------------------------------------------------
    // Search
    // --------------------------------------------------

    if (search) {
      filter.$or = [
        {
          order_number: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          customer_name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          customer_email: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          customer_phone: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    // --------------------------------------------------
    // Date filter
    // --------------------------------------------------

    if (dateFrom || dateTo) {
      filter.created_at = {};

      if (dateFrom) {
        (
          filter.created_at as Record<
            string,
            unknown
          >
        ).$gte = new Date(dateFrom);
      }

      if (dateTo) {
        (
          filter.created_at as Record<
            string,
            unknown
          >
        ).$lte = new Date(dateTo);
      }
    }

    // --------------------------------------------------
    // Fetch orders
    // --------------------------------------------------

    const [total, data] = await Promise.all([
      Order.countDocuments(filter),

      Order.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
      },
    });
  } catch (error) {
    console.error(
      'GET /api/orders error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST /api/orders
// Place order
// Guest or logged in
//
// IMPORTANT:
// This endpoint accepts the JSON payload currently sent
// by your checkout page.
//
// payment_proof is a base64 data URL and is uploaded to
// Cloudinary here.
// =========================================================

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    // =====================================================
    // READ REQUEST BODY
    // =====================================================

    const contentType =
      request.headers.get('content-type') || '';

    let body: any = {};

    /*
     * Your current checkout sends:
     *
     * Content-Type: application/json
     *
     * So we must read JSON here.
     *
     * Multipart support is also kept for compatibility.
     */

    if (
      contentType.includes(
        'multipart/form-data'
      )
    ) {
      const formData =
        await request.formData();

      body = {
        customer_name:
          formData.get(
            'customer_name'
          ),

        customer_phone:
          formData.get(
            'customer_phone'
          ),

        customer_email:
          formData.get(
            'customer_email'
          ),

        customer_address:
          formData.get(
            'customer_address'
          ),

        customer_city:
          formData.get(
            'customer_city'
          ),

        billing_same_as_shipping:
          formData.get(
            'billing_same_as_shipping'
          ),

        billing_name:
          formData.get(
            'billing_name'
          ),

        billing_phone:
          formData.get(
            'billing_phone'
          ),

        billing_email:
          formData.get(
            'billing_email'
          ),

        billing_address:
          formData.get(
            'billing_address'
          ),

        billing_city:
          formData.get(
            'billing_city'
          ),

        items:
          formData.get('items'),

        payment_method:
          formData.get(
            'payment_method'
          ),

        payment_reference:
          formData.get(
            'payment_reference'
          ),

        bank_transfer_discount:
          formData.get(
            'bank_transfer_discount'
          ),

        coupon_code:
          formData.get(
            'coupon_code'
          ),

        delivery_zone:
          formData.get(
            'delivery_zone'
          ),

        notes:
          formData.get('notes'),

        is_guest:
          formData.get('is_guest'),

        payment_proof:
          formData.get(
            'payment_proof'
          ),

        payment_proof_name:
          formData.get(
            'payment_proof_name'
          ),
      };
    } else {
      body = await request.json();
    }

    let sellerOrderContext: {
      sellerId: string;
      referralCode: string;
      sellerName: string;
      productId: string;
      quantity: number;
      requestId: string;
    } | null = null;

    if (body.seller_order === true) {
      const seller = await getSellerFromRequest();
      if (!seller) {
        return NextResponse.json({ success: false, data: null, message: 'Seller sign-in is required.' }, { status: 401 });
      }
      if (seller.status !== 'approved') {
        return NextResponse.json({ success: false, data: null, message: 'Only approved sellers can place customer orders.' }, { status: 403 });
      }

      const productId = String(body.product_id || '');
      const requestId = String(body.seller_request_id || '');
      const quantity = Number(body.quantity);
      const sellingPrice = Number(body.seller_selling_price);
      if (!/^[a-f\d]{24}$/i.test(productId)) {
        return NextResponse.json({ success: false, data: null, message: 'Select a valid product.' }, { status: 400 });
      }
      if (!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId)) {
        return NextResponse.json({ success: false, data: null, message: 'Invalid order request. Please reopen the order form and retry.' }, { status: 400 });
      }
      const duplicateOrder = await Order.findOne({ seller_id: seller._id, seller_request_id: requestId });
      if (duplicateOrder) {
        await createSellerProfitLedger(duplicateOrder);
        return NextResponse.json({ success: true, data: duplicateOrder, duplicate: true }, { status: 200 });
      }

      const product = await Product.findOne({ _id: productId, is_active: true })
        .select('name slug price compare_price images stock variants')
        .lean();
      if (!product) {
        return NextResponse.json({ success: false, data: null, message: 'This product is no longer available.' }, { status: 404 });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return NextResponse.json({ success: false, data: null, message: 'Quantity must be between 1 and 50.' }, { status: 400 });
      }
      if (product.stock < quantity) {
        return NextResponse.json({ success: false, data: null, message: 'There is not enough stock to place this order.' }, { status: 409 });
      }
      if (
        !Number.isFinite(sellingPrice) ||
        sellingPrice < product.price ||
        sellingPrice > 10000000 ||
        Number(sellingPrice.toFixed(2)) !== sellingPrice
      ) {
        return NextResponse.json({ success: false, data: null, message: 'Selling price must be a valid amount at or above the current Veeo product price.' }, { status: 400 });
      }

      const suppliedVariants = body.variant_selections && typeof body.variant_selections === 'object'
        ? body.variant_selections as Record<string, unknown>
        : {};
      const variantSelections: Array<{ label: string; value: string }> = [];
      for (const variant of product.variants || []) {
        if (!variant.options.length) continue;
        const suppliedValue: unknown = suppliedVariants[variant.label];

        const value =
          typeof suppliedValue === 'string'
            ? suppliedValue.trim()
            : '';
        if (!variant.options.includes(value)) {
          return NextResponse.json({ success: false, data: null, message: `Choose a valid option for ${variant.label}.` }, { status: 400 });
        }
        variantSelections.push({ label: variant.label, value });
      }

      const customerName = String(body.customer_name || '').trim();
      const customerPhone = String(body.customer_phone || '').trim();
      const customerEmail = String(body.customer_email || '').trim();
      const customerAddress = String(body.customer_address || '').trim();
      const customerCity = String(body.customer_city || '').trim();
      if (!customerName || customerName.length > 120 || !customerPhone || customerPhone.length > 30 || !customerAddress || customerAddress.length > 500 || !customerCity || customerCity.length > 100) {
        return NextResponse.json({ success: false, data: null, message: 'Enter a valid customer name, phone, delivery address, and city.' }, { status: 400 });
      }
      if (customerEmail && (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))) {
        return NextResponse.json({ success: false, data: null, message: 'Enter a valid customer email address.' }, { status: 400 });
      }
      const sellerEmail = String(seller.email || '').trim().toLowerCase();
      const sellerPhone = String(seller.phone || '').replace(/\D/g, '').slice(-10);
      const customerPhoneDigits = customerPhone.replace(/\D/g, '').slice(-10);
      if (
        (customerEmail && customerEmail.toLowerCase() === sellerEmail) ||
        (sellerPhone && customerPhoneDigits === sellerPhone)
      ) {
        return NextResponse.json({ success: false, data: null, message: 'Seller self-purchases are not eligible for seller profit.' }, { status: 400 });
      }
      const zoneName = String(body.delivery_zone || '').trim();
      const zone = await DeliveryZone.findOne({ name: zoneName, is_active: true }).select('name cities');
      if (!zone) {
        return NextResponse.json({ success: false, data: null, message: 'Choose an available delivery zone.' }, { status: 400 });
      }
      if (
        zone.cities.length &&
        !zone.cities.some(
          (city: string) =>
            city.trim().toLowerCase() === customerCity.toLowerCase()
        )
      ) {
        return NextResponse.json({ success: false, data: null, message: 'The selected delivery zone is not available for this city.' }, { status: 400 });
      }
      if (body.payment_method && body.payment_method !== 'cod') {
        return NextResponse.json({ success: false, data: null, message: 'Seller-placed orders currently support Cash on Delivery only.' }, { status: 400 });
      }

      body.customer_name = customerName;
      body.customer_phone = customerPhone;
      body.customer_email = customerEmail;
      body.customer_address = customerAddress;
      body.customer_city = customerCity;
      body.delivery_zone = zone.name;
      body.billing_same_as_shipping = true;
      body.guest_customer_id = '';
      body.payment_method = 'cod';
      body.coupon_code = '';
      body.bank_transfer_discount = 0;
      body.payment_proof = '';
      body.payment_reference = '';
      body.notes = 'Seller-placed customer order';
      body.is_guest = true;
      body.items = [{
        productId: String(product._id),
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        unitPrice: sellingPrice,
        comparePrice: product.compare_price || 0,
        qty: quantity,
        originalUnitPrice: product.price,
        sellerSellingPrice: sellingPrice,
        sellerProfit: Number((sellingPrice - product.price).toFixed(2)),
        variantSelections,
      }];
      sellerOrderContext = {
        sellerId: String(seller._id),
        referralCode: seller.referral_code,
        sellerName: seller.name,
        productId: String(product._id),
        quantity,
        requestId,
      };
    }

    // =====================================================
    // SHIPPING INFORMATION
    // =====================================================

    const customer_name =
      String(
        body.customer_name || ''
      ).trim();

    const guest_customer_id =
      String(
        body.guest_customer_id || ''
      ).trim();

    const customer_phone =
      String(
        body.customer_phone || ''
      ).trim();

    const customer_email =
      String(
        body.customer_email || ''
      ).trim();

    const customer_address =
      String(
        body.customer_address || ''
      ).trim();

    const customer_city =
      String(
        body.customer_city || ''
      ).trim();

    // =====================================================
    // BILLING INFORMATION
    // =====================================================

    const billing_same_as_shipping =
      body.billing_same_as_shipping !==
      false &&
      body.billing_same_as_shipping !==
      'false';

    const billing_name =
      String(
        body.billing_name || ''
      ).trim();

    const billing_phone =
      String(
        body.billing_phone || ''
      ).trim();

    const billing_email =
      String(
        body.billing_email || ''
      ).trim();

    const billing_address =
      String(
        body.billing_address || ''
      ).trim();

    const billing_city =
      String(
        body.billing_city || ''
      ).trim();

    // =====================================================
    // ORDER ITEMS
    // =====================================================

    let items: any[] = [];

    try {
      if (Array.isArray(body.items)) {
        items = body.items;
      } else if (body.items) {
        items = JSON.parse(
          String(body.items)
        );
      }
    } catch (error) {
      console.error(
        'Failed to parse items:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid order items',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PAYMENT INFORMATION
    // =====================================================

    const payment_method =
      String(
        body.payment_method || 'cod'
      ).trim();

    const payment_reference =
      String(
        body.payment_reference || ''
      ).trim();

    const bank_transfer_discount =
      Number(
        body.bank_transfer_discount || 0
      );

    // =====================================================
    // OTHER INFORMATION
    // =====================================================

    const coupon_code =
      String(
        body.coupon_code || ''
      ).trim();

    const delivery_zone =
      String(
        body.delivery_zone || ''
      ).trim();

    const notes =
      String(
        body.notes || ''
      ).trim();

    const is_guest =
      body.is_guest !== false &&
      body.is_guest !== 'false';

    // =====================================================
    // PAYMENT PROOF
    // =====================================================

    /*
     * Your checkout currently sends:
     *
     * payment_proof: "data:image/jpeg;base64,..."
     *
     * We upload that directly to Cloudinary.
     */

    let payment_proof = '';

    const paymentProofValue =
      body.payment_proof;

    if (
      paymentProofValue &&
      typeof paymentProofValue ===
      'string'
    ) {
      // --------------------------------------------------
      // Validate base64 image
      // --------------------------------------------------

      if (
        !paymentProofValue.startsWith(
          'data:image/'
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              'Invalid payment screenshot format',
          },
          { status: 400 }
        );
      }

      // --------------------------------------------------
      // Approximate decoded size check
      // --------------------------------------------------

      const base64Data =
        paymentProofValue.split(
          ','
        )[1] || '';

      const estimatedSize =
        Math.ceil(
          (base64Data.length * 3) /
          4
        );

      const maxFileSize =
        10 * 1024 * 1024;

      if (
        estimatedSize >
        maxFileSize
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              'Payment screenshot must be smaller than 10MB',
          },
          { status: 400 }
        );
      }

      // --------------------------------------------------
      // Upload base64 image to Cloudinary
      // --------------------------------------------------

      try {
        console.log(
          'Uploading payment proof to Cloudinary...'
        );

        const uploadResult =
          await cloudinary.uploader.upload(
            paymentProofValue,
            {
              folder:
                'shopio/payment-proofs',

              resource_type:
                'image',

              transformation: [
                {
                  quality: 'auto',
                },
                {
                  fetch_format: 'auto',
                },
              ],
            }
          );

        payment_proof =
          uploadResult.secure_url ||
          '';

        console.log(
          'Payment proof uploaded successfully:',
          payment_proof
        );
      } catch (uploadError) {
        console.error(
          'Cloudinary payment proof upload failed:',
          uploadError
        );

        return NextResponse.json(
          {
            success: false,
            data: null,
            message:
              'Failed to upload payment screenshot',
          },
          { status: 500 }
        );
      }
    }

    // =====================================================
    // VALIDATE REQUIRED FIELDS
    // =====================================================

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            'Order must have at least one item',
        },
        { status: 400 }
      );
    }

    if (
      !customer_name ||
      !customer_phone
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            'Customer name and phone are required',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // BANK PAYMENT PROOF VALIDATION
    // =====================================================

    if (
      payment_method === 'bank' &&
      !payment_proof
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            'Payment screenshot is required for bank transfer',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DETERMINE BILLING ADDRESS
    // =====================================================

    const useShippingAsBilling =
      billing_same_as_shipping;

    const finalBillingName =
      useShippingAsBilling
        ? customer_name
        : billing_name;

    const finalBillingPhone =
      useShippingAsBilling
        ? customer_phone
        : billing_phone;

    const finalBillingEmail =
      useShippingAsBilling
        ? customer_email
        : billing_email;

    const finalBillingAddress =
      useShippingAsBilling
        ? customer_address
        : billing_address;

    const finalBillingCity =
      useShippingAsBilling
        ? customer_city
        : billing_city;

    // =====================================================
    // GENERATE ORDER NUMBER
    // =====================================================

    const randomSuffix =
      Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();

    const order_number =
      `ORD-${Date.now()}-${randomSuffix}`;

    let seller_id = sellerOrderContext?.sellerId || null;
    let seller_referral_code = '';
    let seller_name = sellerOrderContext?.sellerName || '';
    if (sellerOrderContext) {
      seller_referral_code = sellerOrderContext.referralCode;
    } else {
      const referralCode = request.cookies.get('veeo_referral')?.value?.trim().toUpperCase();
      if (referralCode && /^[A-Z0-9-]{4,32}$/.test(referralCode)) {
        const referringSeller = await Seller.findOne({ referral_code: referralCode, status: 'approved' }).select('_id name referral_code email phone');
        const normalizedEmail = customer_email.toLowerCase();
        const normalizedPhone = customer_phone.replace(/\D/g, '');
        const sellerPhone = String(referringSeller?.phone || '').replace(/\D/g, '');
        const isSelfPurchase = Boolean(referringSeller && (
          (normalizedEmail && normalizedEmail === referringSeller.email.toLowerCase()) ||
          (normalizedPhone && sellerPhone && normalizedPhone === sellerPhone)
        ));
        if (referringSeller && !isSelfPurchase) {
          seller_id = referringSeller._id;
          seller_referral_code = referringSeller.referral_code;
          seller_name = referringSeller.name;
        }
      }
    }

    // =====================================================
    // CALCULATE SUBTOTAL
    // =====================================================

    let subtotal = 0;

    for (const item of items) {
      const unitPrice =
        Number(item.unitPrice) || 0;

      const qty =
        Number(item.qty) || 0;

      subtotal +=
        unitPrice * qty;
    }
    if (sellerOrderContext) subtotal = Number(subtotal.toFixed(2));

    // =====================================================
    // APPLY COUPON DISCOUNT
    // =====================================================

    let discount = 0;

    let appliedCouponCode = '';

    if (coupon_code) {
      const coupon =
        await Coupon.findOne({
          code: coupon_code,
          is_active: true,
        });

      if (coupon) {
        const now =
          new Date();

        const expired =
          coupon.expires_at &&
          new Date(
            coupon.expires_at
          ) < now;

        const maxUsed =
          coupon.max_uses > 0 &&
          coupon.used_count >=
          coupon.max_uses;

        const minOrderMet =
          subtotal >=
          coupon.min_order;

        if (
          !expired &&
          !maxUsed &&
          minOrderMet
        ) {
          if (
            coupon.type ===
            'percent'
          ) {
            discount =
              subtotal *
              (coupon.value / 100);
          } else {
            discount =
              coupon.value;
          }

          discount =
            Math.min(
              discount,
              subtotal
            );

          appliedCouponCode =
            coupon_code;
        }
      }
    }

    // =====================================================
    // GET DELIVERY FEE
    // =====================================================

    let delivery_fee = 0;

    const deliveryZoneName =
      delivery_zone;

    if (deliveryZoneName) {
      const zone =
        await DeliveryZone.findOne({
          name:
            deliveryZoneName,
          is_active: true,
        });

      if (zone) {
        delivery_fee =
          Number(zone.fee) || 0;
      }
    }

    // =====================================================
    // CALCULATE BANK TRANSFER DISCOUNT
    // =====================================================

    let calculatedBankTransferDiscount =
      0;

    if (
      payment_method === 'bank'
    ) {
      const amountAfterCoupon =
        Math.max(
          0,
          subtotal - discount
        );

      calculatedBankTransferDiscount =
        Number(
          (
            amountAfterCoupon *
            0.07
          ).toFixed(2)
        );
    }

    // =====================================================
    // CALCULATE TOTAL
    // =====================================================

    const total =
      Number(
        (
          subtotal -
          discount -
          calculatedBankTransferDiscount +
          delivery_fee
        ).toFixed(2)
      );

    // =====================================================
    // CREATE OR FIND CUSTOMER
    // =====================================================

    let customer_id:
      string | null = null;

    if (
      customer_email ||
      customer_phone
    ) {
      const orConditions:
        Record<
          string,
          unknown
        >[] = [];

      if (customer_email) {
        orConditions.push({
          email:
            customer_email,
        });
      }

      if (customer_phone) {
        orConditions.push({
          phone:
            customer_phone,
        });
      }

      const existingCustomer =
        await Customer.findOne({
          $or: orConditions,
        }).limit(1);

      if (existingCustomer) {
        customer_id =
          existingCustomer._id.toString();
      } else {
        const newCustomer =
          await Customer.create({
            name:
              customer_name,

            phone:
              customer_phone,

            email:
              customer_email || '',

            address:
              customer_address || '',

            city:
              customer_city || '',

            is_guest:
              is_guest,
          });

        customer_id =
          newCustomer._id.toString();
      }
    }

    // =====================================================
    // CREATE ORDER
    // =====================================================

    if (sellerOrderContext) {
      const stockReservation = await Product.updateOne(
        { _id: sellerOrderContext.productId, is_active: true, stock: { $gte: sellerOrderContext.quantity } },
        { $inc: { stock: -sellerOrderContext.quantity } }
      );
      if (!stockReservation.modifiedCount) {
        return NextResponse.json({ success: false, data: null, message: 'Product stock changed. Refresh the catalogue and try again.' }, { status: 409 });
      }
    }

    let order;
    try {
      order = await Order.create({
        // --------------------------------------------------
        // Order identification
        // --------------------------------------------------

        order_number,
        seller_id,
        seller_referral_code,
        seller_name,
        seller_order: Boolean(sellerOrderContext),
        ...(sellerOrderContext ? { seller_request_id: sellerOrderContext.requestId } : {}),

        // --------------------------------------------------
        // Customer
        // --------------------------------------------------

        customer_id,

        guest_customer_id:
          guest_customer_id ||
          null,

        // --------------------------------------------------
        // Shipping information
        // --------------------------------------------------

        customer_name,

        customer_phone,

        customer_email:
          customer_email || '',

        customer_address:
          customer_address || '',

        customer_city:
          customer_city || '',

        // --------------------------------------------------
        // Billing information
        // --------------------------------------------------

        billing_same_as_shipping:
          useShippingAsBilling,

        billing_name:
          finalBillingName,

        billing_phone:
          finalBillingPhone,

        billing_email:
          finalBillingEmail,

        billing_address:
          finalBillingAddress,

        billing_city:
          finalBillingCity,

        billing_zone:
          deliveryZoneName,

        // --------------------------------------------------
        // Guest
        // --------------------------------------------------

        is_guest:
          is_guest,

        // --------------------------------------------------
        // Items
        // --------------------------------------------------

        items,

        // --------------------------------------------------
        // Pricing
        // --------------------------------------------------

        subtotal,

        discount,

        delivery_fee,

        total,

        // --------------------------------------------------
        // Payment
        // --------------------------------------------------

        payment_method:
          payment_method,

        payment_status:
          'pending',

        // --------------------------------------------------
        // PAYMENT PROOF
        //
        // This is now the Cloudinary secure URL.
        // --------------------------------------------------

        payment_proof:
          payment_proof || '',

        payment_reference:
          payment_reference || '',

        bank_transfer_discount:
          calculatedBankTransferDiscount,

        // --------------------------------------------------
        // Order status
        // --------------------------------------------------

        order_status:
          'pending',

        // --------------------------------------------------
        // Delivery
        // --------------------------------------------------

        delivery_zone:
          deliveryZoneName,

        // --------------------------------------------------
        // Coupon
        // --------------------------------------------------

        coupon_code:
          appliedCouponCode,

        // --------------------------------------------------
        // Notes
        // --------------------------------------------------

        notes:
          notes || '',
      });
    } catch (error) {
      if (sellerOrderContext) {
        await Product.updateOne(
          { _id: sellerOrderContext.productId },
          { $inc: { stock: sellerOrderContext.quantity } }
        );
        const isDuplicateRequest = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
        if (isDuplicateRequest) {
          const existingOrder = await Order.findOne({ seller_id: sellerOrderContext.sellerId, seller_request_id: sellerOrderContext.requestId });
          if (existingOrder) {
            await createSellerProfitLedger(existingOrder);
            return NextResponse.json({ success: true, data: existingOrder, duplicate: true }, { status: 200 });
          }
        }
      }
      throw error;
    }

    await createSellerCommission(order);
    if (sellerOrderContext) await createSellerProfitLedger(order);

    // =====================================================
    // UPDATE COUPON USAGE
    // =====================================================

    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        {
          code:
            appliedCouponCode,

          is_active:
            true,
        },
        {
          $inc: {
            used_count: 1,
          },
        }
      );
    }

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        data: order,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'POST /api/orders error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        data: null,

        message:
          'Failed to place order',
      },
      {
        status: 500,
      }
    );
  }
}