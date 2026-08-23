'use client';

import React from 'react';
import Link from 'next/link';

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#7A1F3D]">
            Our Policies
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            Simple, transparent policies for a smooth shopping experience.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-600">

          {/* Shipping Policy */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Shipping Policy
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>We currently deliver across Pakistan.</li>
              <li>Orders are normally dispatched within 1–2 business days.</li>
              <li>Delivery usually takes 2–5 business days after dispatch.</li>
              <li>Delivery times may vary depending on your location and courier conditions.</li>
              <li>Customers will receive order/tracking updates when available.</li>
              <li>Please provide a complete and accurate delivery address and phone number.</li>
              <li>Orders may be delayed during public holidays, sales, or unforeseen courier issues.</li>
            </ul>
          </section>

          {/* Return Policy */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Return & Exchange Policy
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>We accept return or exchange requests within 7 days of delivery.</li>
              <li>Items must be unused, undamaged, and returned in their original packaging.</li>
              <li>Products showing signs of use, damage, or missing accessories may not be eligible.</li>
              <li>For damaged or incorrect items, contact us as soon as possible with clear photos/videos.</li>
              <li>Return requests must be approved before sending any item back.</li>
              <li>Return shipping may be the customer's responsibility unless the item is damaged or incorrect.</li>
              <li>Refunds, where applicable, are processed after the returned product is inspected.</li>
            </ul>
          </section>

          {/* Order Policy */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Order Policy
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Please check your order details carefully before confirming your purchase.</li>
              <li>Orders may be cancelled before dispatch by contacting us.</li>
              <li>Once an order has been dispatched, cancellation may not be possible.</li>
              <li>Cash on Delivery orders may require confirmation before dispatch.</li>
              <li>Repeated refused or fake orders may be restricted.</li>
            </ul>
          </section>

          {/* Product Policy */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Product Policy
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Product images are provided for illustration and may have minor differences due to lighting or screens.</li>
              <li>Product specifications are mentioned on the respective product page.</li>
              <li>Please check product details carefully before placing your order.</li>
            </ul>
          </section>

          {/* About Us */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              About Us
            </h2>

            <p className="leading-6">
              Veeo Store brings together stylish watches, earbuds, and everyday
              accessories at affordable prices. We focus on offering quality
              products, simple shopping, reliable delivery, and customer
              satisfaction.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Need Help?
            </h2>

            <p className="leading-6">
              If you have any questions regarding your order, shipping, return,
              or exchange, please contact our support team through the contact
              information provided on our website.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-5 border-t flex justify-center gap-5 text-xs">
          <Link
            href="/"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Home
          </Link>

          <Link
            href="/products"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Products
          </Link>

          <Link
            href="/contact"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Contact
          </Link>
        </div>

      </div>
    </main>
  );
}