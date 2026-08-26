

'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Loader as Loader2,
  ShoppingCart,
  CreditCard,
  Banknote,
  MessageCircle,
  Tag,
  X,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Copy,
} from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';

import { formatCurrency } from '@/lib/utils';
import { Coupon, DeliveryZone } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* =========================================================
   PAYMENT METHODS
========================================================= */

const PAYMENT_METHODS = [
  {
    value: 'cod',
    label: 'Cash on Delivery',
    icon: Banknote,
    description: 'Pay when you receive your order',
  },
  {
    value: 'bank',
    label: 'Bank Transfer — Get 7% OFF',
    icon: CreditCard,
    description: 'Pay via Meezan Bank or NayaPay and save 7%',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp Order',
    icon: MessageCircle,
    description: 'Complete order via WhatsApp',
  },
];

/* =========================================================
   BANK DETAILS
   IMPORTANT: REPLACE THESE WITH YOUR REAL DETAILS
========================================================= */

const BANK_DETAILS = {
  meezan: {
    bankName: 'Meezan Bank',
    accountTitle: 'YOUR ACCOUNT TITLE',
    accountNumber: 'YOUR ACCOUNT NUMBER',
    iban: 'YOUR IBAN',
  },

  nayapay: {
    bankName: 'NayaPay',
    accountTitle: 'YOUR ACCOUNT TITLE',
    accountNumber: 'YOUR NAYAPAY NUMBER',
  },
};

/* =========================================================
   BANK TRANSFER DISCOUNT
========================================================= */

const BANK_TRANSFER_DISCOUNT_PERCENT = 7;

/* =========================================================
   CHECKOUT PAGE
========================================================= */

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    subtotal,
    discount,
    deliveryFee,
    couponCode,
    deliveryZoneName,
    clearCart,
    setCouponCode,
    setDiscount,
    setDeliveryFee,
    setDeliveryZoneName,
  } = useCart();

  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || '$';

  /* =======================================================
     SHIPPING FORM
  ======================================================= */

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });

  /* =======================================================
     BILLING FORM
  ======================================================= */

  const [billingSameAsShipping, setBillingSameAsShipping] =
    useState(true);

  const [billingForm, setBillingForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });

  /* =======================================================
     GENERAL STATE
  ======================================================= */

  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* =======================================================
     PAYMENT SCREENSHOT
  ======================================================= */

  const [paymentProof, setPaymentProof] = useState<string>('');

  const [paymentProofName, setPaymentProofName] =
    useState<string>('');

  const [paymentProofLoading, setPaymentProofLoading] =
    useState(false);

  /* =======================================================
     COUPON STATE
  ======================================================= */

  const [couponInput, setCouponInput] = useState(couponCode);

  const [couponLoading, setCouponLoading] = useState(false);

  const [availableCoupons, setAvailableCoupons] =
    useState<Coupon[]>([]);

  /* =======================================================
     DELIVERY ZONE STATE
  ======================================================= */

  const [deliveryZones, setDeliveryZones] =
    useState<DeliveryZone[]>([]);

  const [selectedZone, setSelectedZone] =
    useState<string>('');

  const [zonesLoading, setZonesLoading] =
    useState(true);

  /* =======================================================
     GUEST CUSTOMER
  ======================================================= */

  const [guestCustomerId, setGuestCustomerId] =
    useState('');

  /* =======================================================
     CREATE GUEST CUSTOMER ID
  ======================================================= */

  useEffect(() => {
    let id = localStorage.getItem(
      'guest_customer_id'
    );

    if (!id) {
      id = crypto.randomUUID();

      localStorage.setItem(
        'guest_customer_id',
        id
      );
    }

    setGuestCustomerId(id);
  }, []);

  /* =======================================================
     FETCH COUPONS
  ======================================================= */

  useEffect(() => {
    fetch('/api/coupons?visible=true')
      .then((r) => r.json())
      .then((data) => {
        const coupons: Coupon[] = (
          data.data || []
        ).map(
          (
            c: Coupon & {
              _id?: string;
            }
          ) => ({
            ...c,
            id: c._id || c.id,
          })
        );

        setAvailableCoupons(coupons);
      })
      .catch(() => {});
  }, []);

  /* =======================================================
     FETCH DELIVERY ZONES
  ======================================================= */

  useEffect(() => {
    const fetchDeliveryZones = async () => {
      try {
        const res = await fetch(
          '/api/delivery-zones',
          {
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch delivery zones: ${res.status}`
          );
        }

        const data = await res.json();

        const zones: DeliveryZone[] = (
          data.data || []
        )
          .filter(
            (z: DeliveryZone) =>
              z.is_active
          )
          .map(
            (
              z: DeliveryZone & {
                _id?: string;
              }
            ) => ({
              ...z,
              id: String(
                z._id || z.id
              ),
            })
          );

        setDeliveryZones(zones);

        /* Keep existing selected zone */

        if (deliveryZoneName) {
          const existingZone =
            zones.find(
              (zone) =>
                zone.name
                  ?.trim()
                  .toLowerCase() ===
                deliveryZoneName
                  .trim()
                  .toLowerCase()
            );

          if (existingZone) {
            setSelectedZone(
              String(existingZone.id)
            );

            setDeliveryFee(
              Number(
                existingZone.fee
              ) || 0
            );

            setDeliveryZoneName(
              existingZone.name
            );

            return;
          }
        }

        /* Select Pakistan by default */

        const pakistan =
          zones.find(
            (zone: any) => {
              const name =
                String(
                  zone.name || ''
                )
                  .trim()
                  .toLowerCase();

              const country =
                String(
                  zone.country || ''
                )
                  .trim()
                  .toLowerCase();

              return (
                name ===
                  'pakistan' ||
                country ===
                  'pakistan'
              );
            }
          );

        if (pakistan) {
          const pakistanId =
            String(
              pakistan.id
            );

          setSelectedZone(
            pakistanId
          );

          setDeliveryFee(
            Number(
              pakistan.fee
            ) || 0
          );

          setDeliveryZoneName(
            pakistan.name ||
              'Pakistan'
          );
        }
      } catch (error) {
        console.error(
          'Failed to fetch delivery zones:',
          error
        );
      } finally {
        setZonesLoading(false);
      }
    };

    fetchDeliveryZones();
  }, [
    deliveryZoneName,
    setDeliveryFee,
    setDeliveryZoneName,
  ]);

  /* =======================================================
     DELIVERY ZONE CHANGE
  ======================================================= */

  const handleZoneChange = (
    zoneId: string
  ) => {
    if (zoneId === 'none') {
      setSelectedZone('');
      setDeliveryFee(0);
      setDeliveryZoneName('');

      return;
    }

    const zone =
      deliveryZones.find(
        (z) =>
          String(z.id) ===
          String(zoneId)
      );

    if (!zone) {
      return;
    }

    setSelectedZone(
      String(zone.id)
    );

    setDeliveryFee(
      Number(zone.fee) || 0
    );

    setDeliveryZoneName(
      zone.name || ''
    );
  };

  /* =======================================================
     COUPON
  ======================================================= */

  const handleApplyCoupon = async (
    code?: string
  ) => {
    const codeToApply =
      code ||
      couponInput.trim();

    if (!codeToApply) return;

    setCouponLoading(true);

    try {
      const res = await fetch(
        '/api/coupons/validate',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            code: codeToApply,
            subtotal,
          }),
        }
      );

      const data =
        await res.json();

      if (
        res.ok &&
        data.success
      ) {
        setCouponCode(
          codeToApply
        );

        setCouponInput(
          codeToApply
        );

        setDiscount(
          data.data?.discount ||
            0
        );

        showToast(
          'Coupon applied successfully!'
        );
      } else {
        showToast(
          data.message ||
            'Invalid coupon code',
          'error'
        );

        setCouponCode('');
        setDiscount(0);
      }
    } catch {
      showToast(
        'Failed to validate coupon',
        'error'
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon =
    () => {
      setCouponCode('');
      setCouponInput('');
      setDiscount(0);

      showToast(
        'Coupon removed'
      );
    };

  /* =======================================================
     BANK TRANSFER DISCOUNT
  ======================================================= */

  const bankTransferDiscount =
    paymentMethod === 'bank'
      ? Number(
          (
            subtotal *
            (BANK_TRANSFER_DISCOUNT_PERCENT /
              100)
          ).toFixed(2)
        )
      : 0;

  /* =======================================================
     FINAL TOTAL
  ======================================================= */

  const total =
    subtotal -
    discount -
    bankTransferDiscount +
    deliveryFee;

  /* =======================================================
     SHIPPING FIELD CHANGE
  ======================================================= */

  const handleFieldChange = (
    field: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  /* =======================================================
     BILLING FIELD CHANGE
  ======================================================= */

  const handleBillingFieldChange = (
    field: string,
    value: string
  ) => {
    setBillingForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    const errorKey =
      `billing${field.charAt(0).toUpperCase()}${field.slice(1)}`;

    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  /* =======================================================
     BILLING CHECKBOX
  ======================================================= */

  const handleBillingSameAsShippingChange =
    (checked: boolean) => {
      setBillingSameAsShipping(
        checked
      );

      if (checked) {
        setErrors((prev) => {
          const next = {
            ...prev,
          };

          delete next.billingName;
          delete next.billingPhone;
          delete next.billingEmail;
          delete next.billingAddress;
          delete next.billingCity;

          return next;
        });
      }
    };

  /* =======================================================
     COMPRESS PAYMENT SCREENSHOT
  ======================================================= */

  const compressPaymentImage = (
    file: File
  ): Promise<string> => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const image =
            new Image();

          image.onload = () => {
            const maxWidth =
              1400;

            const scale =
              Math.min(
                1,
                maxWidth /
                  image.width
              );

            const width =
              Math.round(
                image.width *
                  scale
              );

            const height =
              Math.round(
                image.height *
                  scale
              );

            const canvas =
              document.createElement(
                'canvas'
              );

            canvas.width =
              width;

            canvas.height =
              height;

            const context =
              canvas.getContext(
                '2d'
              );

            if (!context) {
              reject(
                new Error(
                  'Unable to process image'
                )
              );

              return;
            }

            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );

            const result =
              canvas.toDataURL(
                'image/jpeg',
                0.78
              );

            resolve(result);
          };

          image.onerror =
            () => {
              reject(
                new Error(
                  'Invalid image'
                )
              );
            };

          image.src =
            reader.result as string;
        };

        reader.onerror =
          () => {
            reject(
              new Error(
                'Failed to read image'
              )
            );
          };

        reader.readAsDataURL(
          file
        );
      }
    );
  };

  /* =======================================================
     PAYMENT SCREENSHOT CHANGE
  ======================================================= */

  const handlePaymentProofChange =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      /* Only images */

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        showToast(
          'Please upload an image file.',
          'error'
        );

        e.target.value = '';

        return;
      }

      /* Maximum original file size: 8 MB */

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        showToast(
          'Payment screenshot must be less than 8MB.',
          'error'
        );

        e.target.value = '';

        return;
      }

      setPaymentProofLoading(
        true
      );

      try {
        const compressed =
          await compressPaymentImage(
            file
          );

        setPaymentProof(
          compressed
        );

        setPaymentProofName(
          file.name
        );

        setErrors((prev) => ({
          ...prev,
          paymentProof: '',
        }));
      } catch {
        showToast(
          'Failed to process payment screenshot.',
          'error'
        );

        setPaymentProof('');
        setPaymentProofName('');
      } finally {
        setPaymentProofLoading(
          false
        );

        e.target.value = '';
      }
    };

  /* =======================================================
     REMOVE PAYMENT SCREENSHOT
  ======================================================= */

  const removePaymentProof =
    () => {
      setPaymentProof('');
      setPaymentProofName('');

      setErrors((prev) => ({
        ...prev,
        paymentProof: '',
      }));
    };

  /* =======================================================
     COPY BANK DETAIL
  ======================================================= */

  const copyBankDetail = async (
    value: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      showToast(
        'Copied to clipboard!'
      );
    } catch {
      showToast(
        'Unable to copy',
        'error'
      );
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = (): boolean => {
    const newErrors: Record<
      string,
      string
    > = {};

    /* Shipping */

    if (!form.name.trim()) {
      newErrors.name =
        'Name is required';
    }

    if (!form.phone.trim()) {
      newErrors.phone =
        'Phone is required';
    }

    if (!form.email.trim()) {
      newErrors.email =
        'Email is required';
    } else if (
      !/\S+@\S+\.\S+/.test(
        form.email
      )
    ) {
      newErrors.email =
        'Invalid email';
    }

    if (!form.address.trim()) {
      newErrors.address =
        'Address is required';
    }

    if (!form.city.trim()) {
      newErrors.city =
        'City is required';
    }

    /* Billing */

    if (!billingSameAsShipping) {
      if (
        !billingForm.name.trim()
      ) {
        newErrors.billingName =
          'Name is required';
      }

      if (
        !billingForm.phone.trim()
      ) {
        newErrors.billingPhone =
          'Phone is required';
      }

      if (
        !billingForm.email.trim()
      ) {
        newErrors.billingEmail =
          'Email is required';
      } else if (
        !/\S+@\S+\.\S+/.test(
          billingForm.email
        )
      ) {
        newErrors.billingEmail =
          'Invalid email';
      }

      if (
        !billingForm.address.trim()
      ) {
        newErrors.billingAddress =
          'Address is required';
      }

      if (
        !billingForm.city.trim()
      ) {
        newErrors.billingCity =
          'City is required';
      }
    }

    /* Bank Transfer */

    if (
      paymentMethod ===
      'bank' &&
      !paymentProof
    ) {
      newErrors.paymentProof =
        'Please upload your payment screenshot';
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  /* =======================================================
     WHATSAPP NUMBER
  ======================================================= */

  const formatWhatsAppNumber =
    (
      phone: string
    ) => {
      let number =
        phone
          .trim()
          .replace(
            /\D/g,
            ''
          );

      if (
        number.startsWith(
          '0'
        )
      ) {
        number =
          '92' +
          number.substring(
            1
          );
      }

      if (
        number.startsWith(
          '92'
        )
      ) {
        return number;
      }

      return number;
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (
      items.length === 0
    ) {
      showToast(
        'Your cart is empty',
        'error'
      );

      return;
    }

    if (
      !guestCustomerId
    ) {
      showToast(
        'Please wait a moment and try again.',
        'error'
      );

      return;
    }

    /* =====================================================
       WHATSAPP ORDER
    ===================================================== */

    if (
      paymentMethod ===
      'whatsapp'
    ) {
      const whatsappNumber =
        settings?.whatsapp_number ||
        '';

      if (!whatsappNumber) {
        showToast(
          'WhatsApp ordering not available',
          'error'
        );

        return;
      }

      const orderLines =
        items
          .map(
            (item) =>
              `- ${item.name}${
                item.variant
                  ? ` (${item.variant})`
                  : ''
              } x${item.qty} = ${formatCurrency(
                item.price *
                  item.qty,
                currency
              )}`
          )
          .join(
            '\n'
          );

      const billingDetails =
        billingSameAsShipping
          ? `*Billing Address:* Same as shipping\n`
          : `*Billing Name:* ${billingForm.name}\n` +
            `*Billing Phone:* ${billingForm.phone}\n` +
            `*Billing Email:* ${billingForm.email}\n` +
            `*Billing Address:* ${billingForm.address}, ${billingForm.city}\n`;

      const message =
        encodeURIComponent(
          `${
            settings?.whatsapp_message
              ? `_${settings.whatsapp_message}_\n\n`
              : ''
          }` +
          `*🛍️ NEW ORDER*\n\n` +
          `*Order Items:*\n${orderLines}\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `*Subtotal:* ${formatCurrency(
            subtotal,
            currency
          )}\n` +
          `${
            discount > 0
              ? `*Discount:* -${formatCurrency(
                  discount,
                  currency
                )}\n`
              : ''
          }` +
          `*Delivery:* ${
            deliveryFee === 0
              ? 'Free'
              : formatCurrency(
                  deliveryFee,
                  currency
                )
          }\n` +
          `*TOTAL: ${formatCurrency(
            total,
            currency
          )}*\n` +
          `━━━━━━━━━━━━━━━━\n\n` +
          `*👤 Customer Details*\n` +
          `*Name:* ${form.name}\n` +
          `*Phone:* ${form.phone}\n` +
          `*Email:* ${form.email}\n` +
          `*Shipping Address:* ${form.address}, ${form.city}\n` +
          billingDetails +
          `${
            notes
              ? `*Notes:* _${notes}_\n`
              : ''
          }\n` +
          `*💳 Payment:* WhatsApp Order`
        );

      const formattedWhatsAppNumber =
        formatWhatsAppNumber(
          whatsappNumber
        );

      window.open(
        `https://wa.me/${formattedWhatsAppNumber}?text=${message}`,
        '_blank'
      );

      return;
    }

    /* =====================================================
       NORMAL ORDER
    ===================================================== */

    setSubmitting(true);

    try {
      const res =
        await fetch(
          '/api/orders',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                /* Shipping */

                customer_name:
                  form.name.trim(),

                customer_phone:
                  form.phone.trim(),

                customer_email:
                  form.email.trim(),

                customer_address:
                  form.address.trim(),

                customer_city:
                  form.city.trim(),

                /* Billing */

                billing_name:
                  billingSameAsShipping
                    ? form.name.trim()
                    : billingForm.name.trim(),

                billing_phone:
                  billingSameAsShipping
                    ? form.phone.trim()
                    : billingForm.phone.trim(),

                billing_email:
                  billingSameAsShipping
                    ? form.email.trim()
                    : billingForm.email.trim(),

                billing_address:
                  billingSameAsShipping
                    ? form.address.trim()
                    : billingForm.address.trim(),

                billing_city:
                  billingSameAsShipping
                    ? form.city.trim()
                    : billingForm.city.trim(),

                billing_same_as_shipping:
                  billingSameAsShipping,

                /* Guest */

                is_guest: true,

                guest_customer_id:
                  guestCustomerId,

                /* Items */

                items:
                  items.map(
                    (item) => ({
                      productId:
                        item.productId,

                      name:
                        item.name,

                      image:
                        item.image,

                      qty:
                        item.qty,

                      unitPrice:
                        item.price,

                      variant:
                        item.variant ||
                        undefined,
                    })
                  ),

                /* Pricing */

                subtotal,

                discount,

                /* Dedicated bank discount */

                bank_transfer_discount:
                  bankTransferDiscount,

                delivery_fee:
                  deliveryFee,

                total,

                /* Payment */

                payment_method:
                  paymentMethod,

                /* Payment proof */

                payment_proof:
                  paymentMethod ===
                  'bank'
                    ? paymentProof
                    : undefined,

                payment_proof_name:
                  paymentMethod ===
                  'bank'
                    ? paymentProofName
                    : undefined,

                /* Coupon / Delivery */

                coupon_code:
                  couponCode ||
                  undefined,

                delivery_zone:
                  deliveryZoneName ||
                  undefined,

                /* Notes */

                notes:
                  notes.trim() ||
                  undefined,
              }),
          }
        );

      const data =
        await res.json();

      if (
        res.ok &&
        data.data
          ?.order_number
      ) {
        try {
          const saved =
            localStorage.getItem(
              'recentOrders'
            );

          const existing: string[] =
            saved
              ? JSON.parse(
                  saved
                )
              : [];

          const updated = [
            data.data
              .order_number,
            ...existing,
          ].slice(0, 10);

          localStorage.setItem(
            'recentOrders',
            JSON.stringify(
              updated
            )
          );
        } catch {}

        clearCart();

        showToast(
          paymentMethod ===
            'bank'
            ? 'Order submitted! Payment will be verified shortly.'
            : 'Order placed successfully!'
        );

        router.push(
          `/order/${data.data.order_number}`
        );
      } else {
        showToast(
          data.message ||
            'Failed to place order',
          'error'
        );
      }
    } catch {
      showToast(
        'Failed to place order. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    items.length === 0
  ) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300" />

        <h1 className="text-xl font-semibold text-gray-900 mt-6">
          Nothing to checkout
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          Add some items to your cart first.
        </p>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Checkout
      </h1>

      <form onSubmit={handleSubmit}>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="flex-1 space-y-6">

            {/* =================================================
                SHIPPING INFORMATION
            ================================================= */}

            <div className="border rounded-lg p-5 bg-white">

              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Name */}

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Full Name *
                  </label>

                  <Input
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'name',
                        e.target
                          .value
                      )
                    }
                    placeholder="Name"
                    className={
                      errors.name
                        ? 'border-red-500'
                        : ''
                    }
                  />

                  {errors.name && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Phone *
                  </label>

                  <Input
                    value={
                      form.phone
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'phone',
                        e.target
                          .value
                      )
                    }
                    placeholder="Phone"
                    className={
                      errors.phone
                        ? 'border-red-500'
                        : ''
                    }
                  />

                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Email *
                  </label>

                  <Input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'email',
                        e.target
                          .value
                      )
                    }
                    placeholder="Email"
                    className={
                      errors.email
                        ? 'border-red-500'
                        : ''
                    }
                  />

                  {errors.email && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Address */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Address *
                  </label>

                  <Input
                    value={
                      form.address
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'address',
                        e.target
                          .value
                      )
                    }
                    placeholder="Address"
                    className={
                      errors.address
                        ? 'border-red-500'
                        : ''
                    }
                  />

                  {errors.address && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* City */}

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    City *
                  </label>

                  <Input
                    value={
                      form.city
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'city',
                        e.target
                          .value
                      )
                    }
                    placeholder="City"
                    className={
                      errors.city
                        ? 'border-red-500'
                        : ''
                    }
                  />

                  {errors.city && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.city}
                    </p>
                  )}
                </div>

              </div>

              {/* Delivery Zone */}

              <div className="mt-3">

                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Country/Region{' '}
                  <span className="text-gray-400">
                    (optional)
                  </span>
                </label>

                <Select
                  value={
                    selectedZone ||
                    undefined
                  }
                  onValueChange={
                    handleZoneChange
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem
                      value="none"
                      className="text-xs text-gray-400"
                    >
                      No delivery zone
                    </SelectItem>

                    {deliveryZones.map(
                      (zone) => (
                        <SelectItem
                          key={String(
                            zone.id
                          )}
                          value={String(
                            zone.id
                          )}
                          className="text-xs"
                        >
                          {zone.name}{' '}
                          -{' '}
                          {formatCurrency(
                            zone.fee,
                            currency
                          )}
                        </SelectItem>
                      )
                    )}

                  </SelectContent>
                </Select>

              </div>

              {/* Order Notes */}

              <div className="mt-3">

                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Order Notes (optional)
                </label>

                <Input
                  value={
                    notes
                  }
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Any special instructions..."
                />

              </div>

            </div>

            {/* =================================================
                BILLING ADDRESS
            ================================================= */}

            <div className="border rounded-lg p-5 bg-white">

              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Billing Address
              </h2>

              <label className="flex items-center gap-2 cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    billingSameAsShipping
                  }
                  onChange={(e) =>
                    handleBillingSameAsShippingChange(
                      e.target
                        .checked
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#7A1F3D] focus:ring-[#7A1F3D] accent-[#7A1F3D]"
                />

                <span className="text-sm text-gray-700">
                  Same as shipping address
                </span>

              </label>

              {!billingSameAsShipping && (
                <div className="mt-5 pt-5 border-t border-gray-100">

                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Billing Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* Billing Name */}

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Full Name *
                      </label>

                      <Input
                        value={
                          billingForm.name
                        }
                        onChange={(e) =>
                          handleBillingFieldChange(
                            'name',
                            e.target
                              .value
                          )
                        }
                        placeholder="Name"
                        className={
                          errors.billingName
                            ? 'border-red-500'
                            : ''
                        }
                      />

                      {errors.billingName && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {
                            errors.billingName
                          }
                        </p>
                      )}
                    </div>

                    {/* Billing Phone */}

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Phone *
                      </label>

                      <Input
                        value={
                          billingForm.phone
                        }
                        onChange={(e) =>
                          handleBillingFieldChange(
                            'phone',
                            e.target
                              .value
                          )
                        }
                        placeholder="Phone"
                        className={
                          errors.billingPhone
                            ? 'border-red-500'
                            : ''
                        }
                      />

                      {errors.billingPhone && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {
                            errors.billingPhone
                          }
                        </p>
                      )}
                    </div>

                    {/* Billing Email */}

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Email *
                      </label>

                      <Input
                        type="email"
                        value={
                          billingForm.email
                        }
                        onChange={(e) =>
                          handleBillingFieldChange(
                            'email',
                            e.target
                              .value
                          )
                        }
                        placeholder="Email"
                        className={
                          errors.billingEmail
                            ? 'border-red-500'
                            : ''
                        }
                      />

                      {errors.billingEmail && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {
                            errors.billingEmail
                          }
                        </p>
                      )}
                    </div>

                    {/* Billing Address */}

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Address *
                      </label>

                      <Input
                        value={
                          billingForm.address
                        }
                        onChange={(e) =>
                          handleBillingFieldChange(
                            'address',
                            e.target
                              .value
                          )
                        }
                        placeholder="Billing address"
                        className={
                          errors.billingAddress
                            ? 'border-red-500'
                            : ''
                        }
                      />

                      {errors.billingAddress && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {
                            errors.billingAddress
                          }
                        </p>
                      )}
                    </div>

                    {/* Billing City */}

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        City *
                      </label>

                      <Input
                        value={
                          billingForm.city
                        }
                        onChange={(e) =>
                          handleBillingFieldChange(
                            'city',
                            e.target
                              .value
                          )
                        }
                        placeholder="City"
                        className={
                          errors.billingCity
                            ? 'border-red-500'
                            : ''
                        }
                      />

                      {errors.billingCity && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {
                            errors.billingCity
                          }
                        </p>
                      )}
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* =================================================
                COUPON
            ================================================= */}

            <div className="border rounded-lg p-5 bg-white">

              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Coupon Code
              </h2>

              {couponCode &&
              discount > 0 ? (

                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">

                  <div className="flex items-center gap-2">

                    <Tag className="h-3.5 w-3.5 text-green-600" />

                    <span className="text-xs font-medium text-green-600">
                      {couponCode}
                    </span>

                    <span className="text-xs text-green-600">
                      (-
                      {formatCurrency(
                        discount,
                        currency
                      )}
                      )
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveCoupon
                    }
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                </div>

              ) : (

                <div className="space-y-3">

                  <div className="flex gap-2">

                    <Input
                      placeholder="Enter coupon code"
                      value={
                        couponInput
                      }
                      onChange={(e) =>
                        setCouponInput(
                          e.target
                            .value
                        )
                      }
                      className="h-9 text-sm"
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          'Enter'
                        ) {
                          e.preventDefault();

                          handleApplyCoupon();
                        }
                      }}
                    />

                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white"
                      onClick={() =>
                        handleApplyCoupon()
                      }
                      disabled={
                        couponLoading
                      }
                    >
                      {couponLoading
                        ? 'Applying...'
                        : 'Apply'}
                    </Button>

                  </div>

                  {availableCoupons.length >
                    0 && (

                    <div>

                      <p className="text-xs text-gray-500 mb-2">
                        Available coupons:
                      </p>

                      <div className="space-y-1.5">

                        {availableCoupons.map(
                          (
                            coupon
                          ) => (

                            <button
                              key={
                                coupon.id
                              }
                              type="button"
                              onClick={() =>
                                handleApplyCoupon(
                                  coupon.code
                                )
                              }
                              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors text-left"
                            >

                              <div className="flex items-center gap-2">

                                <Tag className="h-3 w-3 text-green-600" />

                                <span className="text-xs font-mono font-medium text-gray-900">
                                  {
                                    coupon.code
                                  }
                                </span>

                              </div>

                              <span className="text-xs text-green-600 font-medium">
                                {coupon.type ===
                                'percent'
                                  ? `${coupon.value}% off`
                                  : `${formatCurrency(
                                      coupon.value,
                                      currency
                                    )} off`}
                              </span>

                            </button>

                          )
                        )}

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

            {/* =================================================
                PAYMENT METHOD
            ================================================= */}

            <div className="border rounded-lg p-5 bg-white">

              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>

              <div className="space-y-2">

                {PAYMENT_METHODS.map(
                  (method) => {

                    const Icon =
                      method.icon;

                    return (
                      <label
                        key={
                          method.value
                        }
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          paymentMethod ===
                          method.value
                            ? 'border-[#7A1F3D] bg-[#7A1F3D]/[0.02]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >

                        <input
                          type="radio"
                          name="paymentMethod"
                          value={
                            method.value
                          }
                          checked={
                            paymentMethod ===
                            method.value
                          }
                          onChange={() =>
                            setPaymentMethod(
                              method.value
                            )
                          }
                          className="text-[[#7A1F3D] focus:ring-[#7A1F3D] accent-[#7A1F3D]"
                        />

                        <Icon
                          className={`h-4 w-4 ${
                            paymentMethod ===
                            method.value
                              ? 'text-[#7A1F3D]'
                              : 'text-gray-400'
                          }`}
                        />

                        <div className="flex-1">

                          <div className="flex items-center gap-2">

                            <p className="text-sm font-medium text-gray-900">
                              {
                                method.label
                              }
                            </p>

                            {method.value ===
                              'bank' && (
                              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                SAVE&nbsp;7%
                              </span>
                            )}

                          </div>

                          <p className="text-xs text-gray-500">
                            {
                              method.description
                            }
                          </p>

                        </div>

                      </label>
                    );
                  }
                )}

              </div>

              {/* =================================================
                  BANK TRANSFER DETAILS
              ================================================= */}

              {paymentMethod ===
                'bank' && (

                <div className="mt-5 space-y-4">

                  {/* Discount Banner */}

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Tag className="h-4 w-4 text-green-600" />
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-green-800">
                          You save{' '}
                          {formatCurrency(
                            bankTransferDiscount,
                            currency
                          )}{' '}
                          with Bank Transfer
                        </p>

                        <p className="text-xs text-green-700 mt-1">
                          Get{' '}
                          {
                            BANK_TRANSFER_DISCOUNT_PERCENT
                          }
                          % OFF your order by paying through Meezan Bank or NayaPay.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Payment Instructions */}

                  <div className="rounded-lg border border-gray-200 overflow-hidden">

                    <div className="px-4 py-3 bg-gray-50 border-b">

                      <p className="text-sm font-semibold text-gray-900">
                        Transfer Payment To
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Please transfer the exact discounted amount shown below.
                      </p>

                    </div>

                    {/* Meezan */}

                    <div className="p-4 border-b">

                      <div className="flex items-center justify-between mb-3">

                        <div>

                          <p className="text-sm font-semibold text-gray-900">
                            Meezan Bank
                          </p>

                          <p className="text-xs text-gray-500">
                            Bank Transfer
                          </p>

                        </div>

                        <CreditCard className="h-5 w-5 text-[#7A1F3D]" />

                      </div>

                      <div className="space-y-2">

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              Account Title
                            </p>

                            <p className="text-xs font-medium text-gray-900">
                              {
                                BANK_DETAILS
                                  .meezan
                                  .accountTitle
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyBankDetail(
                                BANK_DETAILS
                                  .meezan
                                  .accountTitle
                              )
                            }
                            className="text-gray-400 hover:text-[#7A1F3D]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                        </div>

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              Account Number
                            </p>

                            <p className="text-xs font-medium text-gray-900 break-all">
                              {
                                BANK_DETAILS
                                  .meezan
                                  .accountNumber
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyBankDetail(
                                BANK_DETAILS
                                  .meezan
                                  .accountNumber
                              )
                            }
                            className="text-gray-400 hover:text-[#7A1F3D]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                        </div>

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              IBAN
                            </p>

                            <p className="text-xs font-medium text-gray-900 break-all">
                              {
                                BANK_DETAILS
                                  .meezan
                                  .iban
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyBankDetail(
                                BANK_DETAILS
                                  .meezan
                                  .iban
                              )
                            }
                            className="text-gray-400 hover:text-[#7A1F3D]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                        </div>

                      </div>

                    </div>

                    {/* NayaPay */}

                    <div className="p-4">

                      <div className="flex items-center justify-between mb-3">

                        <div>

                          <p className="text-sm font-semibold text-gray-900">
                            NayaPay
                          </p>

                          <p className="text-xs text-gray-500">
                            Instant Transfer
                          </p>

                        </div>

                        <CreditCard className="h-5 w-5 text-[#7A1F3D]" />

                      </div>

                      <div className="space-y-2">

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              Account Title
                            </p>

                            <p className="text-xs font-medium text-gray-900">
                              {
                                BANK_DETAILS
                                  .nayapay
                                  .accountTitle
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyBankDetail(
                                BANK_DETAILS
                                  .nayapay
                                  .accountTitle
                              )
                            }
                            className="text-gray-400 hover:text-[#7A1F3D]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                        </div>

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              NayaPay Number
                            </p>

                            <p className="text-xs font-medium text-gray-900">
                              {
                                BANK_DETAILS
                                  .nayapay
                                  .accountNumber
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyBankDetail(
                                BANK_DETAILS
                                  .nayapay
                                  .accountNumber
                              )
                            }
                            className="text-gray-400 hover:text-[#7A1F3D]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Amount To Transfer */}

                  <div className="rounded-lg border p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-gray-500">
                          Amount to Transfer
                        </p>

                        <p className="text-xl font-bold text-black mt-0.5">
                          {formatCurrency(
                            total,
                            currency
                          )}
                        </p>

                      </div>

                      <CheckCircle2 className="h-6 w-6 text-green-600" />

                    </div>

                  </div>

                  {/* Payment Screenshot */}

                  <div className="rounded-lg border border-gray-200 p-4">

                    <div className="flex items-start justify-between gap-3 mb-3">

                      <div>

                        <p className="text-sm font-semibold text-gray-900">
                          Payment Screenshot *
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          Upload a screenshot after completing the transfer.
                        </p>

                      </div>

                      <Upload className="h-4 w-4 text-gray-400 shrink-0" />

                    </div>

                    {!paymentProof ? (

                      <label className="block">

                        <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handlePaymentProofChange
                          }
                          className="hidden"
                          disabled={
                            paymentProofLoading
                          }
                        />

                        <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          errors.paymentProof
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 hover:border-[#7A1F3D] hover:bg-gray-50'
                        }`}>

                          {paymentProofLoading ? (

                            <div className="flex flex-col items-center">

                              <Loader2 className="h-6 w-6 text-[#7A1F3D] animate-spin" />

                              <p className="text-xs text-gray-500 mt-2">
                                Processing screenshot...
                              </p>

                            </div>

                          ) : (

                            <>
                              <Upload className="h-7 w-7 mx-auto text-gray-300" />

                              <p className="text-sm font-medium text-gray-700 mt-2">
                                Click to upload screenshot
                              </p>

                              <p className="text-[11px] text-gray-400 mt-1">
                                JPG, PNG or WEBP • Max 8MB
                              </p>
                            </>

                          )}

                        </div>

                      </label>

                    ) : (

                      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">

                        <img
                          src={
                            paymentProof
                          }
                          alt="Payment proof"
                          className="w-full max-h-72 object-contain"
                        />

                        <button
                          type="button"
                          onClick={
                            removePaymentProof
                          }
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                          title="Remove screenshot"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="px-3 py-2 bg-white border-t flex items-center justify-between">

                          <p className="text-xs text-gray-600 truncate">
                            {paymentProofName}
                          </p>

                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />

                        </div>

                      </div>

                    )}

                    {errors.paymentProof && (
                      <p className="text-xs text-red-500 mt-2">
                        {
                          errors.paymentProof
                        }
                      </p>
                    )}

                  </div>

                  {/* Trust / Satisfaction */}

                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">

                    <div className="space-y-2">

                      <div className="flex items-center gap-2">

                        <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />

                        <p className="text-[11px] text-gray-600">
                          Secure payment handling & order verification.
                        </p>

                      </div>

                      <div className="flex items-center gap-2">

                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />

                        <p className="text-[11px] text-gray-600">
                          Your order is confirmed after payment verification.
                        </p>

                      </div>

                      <div className="flex items-center gap-2">

                        <MessageCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />

                        <p className="text-[11px] text-gray-600">
                          Need help? Our support team is here for you.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div className="lg:w-80 shrink-0">

            <div className="border rounded-lg p-5 bg-white sticky top-20">

              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 max-h-60 overflow-y-auto">

                {items.map(
                  (item) => (

                    <div
                      key={`${item.productId}-${item.variant}`}
                      className="flex items-center gap-3"
                    >

                      <div className="w-10 h-10 shrink-0 bg-gray-100 rounded overflow-hidden">

                        <img
                          src={
                            item.image ||
                            '/placeholder.png'
                          }
                          alt={
                            item.name
                          }
                          className="w-full h-full object-cover"
                        />

                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm text-gray-900 truncate">
                          {
                            item.name
                          }
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.variant
                            ? `${item.variant} / `
                            : ''}
                          Qty:{' '}
                          {
                            item.qty
                          }
                        </p>

                      </div>

                      <span className="text-sm font-medium shrink-0">
                        {formatCurrency(
                          item.price *
                            item.qty,
                          currency
                        )}
                      </span>

                    </div>

                  )
                )}

              </div>

              <Separator className="my-4" />

              <div className="space-y-2">

                {/* Subtotal */}

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    {formatCurrency(
                      subtotal,
                      currency
                    )}
                  </span>

                </div>

                {/* Coupon Discount */}

                {discount > 0 && (

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Coupon Discount
                    </span>

                    <span className="text-green-600">
                      -
                      {formatCurrency(
                        discount,
                        currency
                      )}
                    </span>

                  </div>

                )}

                {/* Bank Discount */}

                {bankTransferDiscount >
                  0 && (

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Bank Transfer (7% OFF)
                    </span>

                    <span className="text-green-600 font-medium">
                      -
                      {formatCurrency(
                        bankTransferDiscount,
                        currency
                      )}
                    </span>

                  </div>

                )}

                {/* Delivery */}

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Delivery
                  </span>

                  <span className="font-medium">
                    {deliveryFee ===
                    0
                      ? 'Free'
                      : formatCurrency(
                          deliveryFee,
                          currency
                        )}
                  </span>

                </div>

                <Separator />

                {/* Total */}

                <div className="flex justify-between text-sm font-semibold">

                  <span>
                    Total
                  </span>

                  <span className="text-black">
                    {formatCurrency(
                      total,
                      currency
                    )}
                  </span>

                </div>

              </div>

              {/* Bank Transfer Savings */}

              {paymentMethod ===
                'bank' && (
                <div className="mt-3 rounded-md bg-green-50 border border-green-100 px-3 py-2">

                  <div className="flex justify-between items-center">

                    <span className="text-xs font-medium text-green-700">
                      You save
                    </span>

                    <span className="text-xs font-bold text-green-700">
                      {formatCurrency(
                        bankTransferDiscount,
                        currency
                      )}
                    </span>

                  </div>

                </div>
              )}

              {/* Submit */}

              <Button
                type="submit"
                className="w-full h-10 mt-4 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white"
                disabled={
                  submitting ||
                  paymentProofLoading
                }
              >

                {submitting ? (

                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />

                    {paymentMethod ===
                    'bank'
                      ? 'Submitting Order...'
                      : 'Placing Order...'}
                  </>

                ) : paymentMethod ===
                  'whatsapp' ? (

                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />

                    Order via WhatsApp
                  </>

                ) : paymentMethod ===
                  'bank' ? (

                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />

                    Confirm Bank Transfer Order
                  </>

                ) : (

                  'Place Order'

                )}

              </Button>

              {paymentMethod ===
                'bank' && (
                <p className="text-[10px] text-center text-gray-400 mt-2 leading-relaxed">
                  Your order will be processed after we verify your payment.
                </p>
              )}

            </div>

          </div>

        </div>

      </form>

    </div>
  );
}