'use client';

import React from 'react';
import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#7A1F3D]">
            Returns & Refunds
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            Our return and refund policy for Veeo Store customers.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-600">

          {/* Return Eligibility */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Return Eligibility
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Return or exchange requests must be submitted within 7 days of delivery.</li>
              <li>Items must be unused, undamaged, and returned in their original packaging.</li>
              <li>Products showing signs of use, damage, or missing accessories may not be eligible for return.</li>
              <li>Change-of-mind returns may not be accepted unless otherwise stated on the product page.</li>
            </ul>
          </section>

          {/* Damaged or Incorrect Items */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Damaged or Incorrect Items
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>
                If you receive a damaged or incorrect item, please contact us
                as soon as possible with clear photos or videos of the product.
              </li>
              <li>
                The return must be approved by Veeo before the item is sent back.
              </li>
              <li>
                Return shipping may be covered by Veeo when the item received
                is damaged or incorrect.
              </li>
            </ul>
          </section>

          {/* Return Process */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Return Process
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Contact our support team with your order details.</li>
              <li>Provide photos or videos where required.</li>
              <li>Wait for return approval and instructions.</li>
              <li>Send the approved item according to the provided instructions.</li>
              <li>The returned item will be inspected before a refund or exchange is approved.</li>
            </ul>
          </section>

          {/* Refunds */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Refunds
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>
                Refunds, where applicable, are processed after the returned
                product has been received and inspected.
              </li>
              <li>
                Approved refunds are processed within 5–7 business days after
                the returned product has been received and inspected.
              </li>
              <li>
                The actual time for the funds to appear may vary depending on
                the payment method or financial institution.
              </li>
            </ul>
          </section>

          {/* Exchanges */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Exchanges
            </h2>

            <p className="leading-6">
              Exchanges may be available for eligible products subject to
              product availability. The replacement item will be dispatched
              after the returned product has been received and approved.
            </p>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Order Cancellation
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Orders may be cancelled before dispatch by contacting us.</li>
              <li>Once an order has been dispatched, cancellation may not be possible.</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="border-t pt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Need Help?
            </h2>

            <p className="leading-6">
              If you have any questions regarding returns or refunds, please
              contact Veeo Store through the contact information provided on
              our website.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-5 border-t flex flex-wrap justify-center gap-5 text-xs">
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
            href="/privacy"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Terms & Conditions
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