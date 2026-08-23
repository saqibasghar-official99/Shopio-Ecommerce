'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#7A1F3D]">
            Terms & Conditions
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            Please review these terms before placing an order with Veeo Store.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-600">

          {/* General */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. General
            </h2>

            <p className="leading-6">
              By accessing or using Veeo Store, you agree to follow these
              Terms & Conditions. If you do not agree with any part of these
              terms, please do not use our website.
            </p>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. Products & Pricing
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Product descriptions, images, and specifications are provided as accurately as possible.</li>
              <li>Minor differences in product color or appearance may occur due to lighting or screen settings.</li>
              <li>Prices may change without prior notice.</li>
              <li>We reserve the right to correct pricing or product information errors.</li>
              <li>Product availability may change at any time.</li>
            </ul>
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. Orders
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Customers must provide accurate name, phone number, and delivery address.</li>
              <li>We may contact customers to confirm an order before dispatch.</li>
              <li>We reserve the right to cancel or refuse suspicious, duplicate, or fraudulent orders.</li>
              <li>Orders cannot always be cancelled after dispatch.</li>
            </ul>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Payment
            </h2>

            <p className="leading-6">
              We may offer Cash on Delivery and other payment methods displayed
              at checkout. Customers are responsible for providing accurate
              payment and order information.
            </p>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Shipping & Delivery
            </h2>

            <p className="leading-6">
              Delivery times are estimates and may vary depending on location,
              courier operations, weather, holidays, or other unforeseen
              circumstances. Veeo Store is not responsible for delays caused by
              third-party courier services.
            </p>
          </section>

          {/* Returns */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Returns & Exchanges
            </h2>

            <p className="leading-6">
              Returns and exchanges are subject to our{' '}
              <Link
                href="/policies"
                className="text-[#7A1F3D] font-medium hover:underline"
              >
                Return Policy
              </Link>
              . Products must meet the applicable return conditions before a
              return or exchange can be approved.
            </p>
          </section>

          {/* Website Usage */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. Website Usage
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Do not use the website for unlawful or fraudulent activities.</li>
              <li>Do not attempt to interfere with or damage the website or its services.</li>
              <li>Website content, branding, images, and design may not be copied or used without permission.</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              8. Intellectual Property
            </h2>

            <p className="leading-6">
              All website content, including logos, text, graphics, product
              images, and design elements, belongs to Veeo Store or its
              respective owners and may not be reproduced without permission.
            </p>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              9. Limitation of Liability
            </h2>

            <p className="leading-6">
              Veeo Store will make reasonable efforts to provide accurate
              information and reliable services. However, we are not liable for
              indirect losses, courier delays, service interruptions, or events
              beyond our reasonable control.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              10. Changes to These Terms
            </h2>

            <p className="leading-6">
              We may update these Terms & Conditions when necessary. Any
              changes will be posted on this page. Continued use of the website
              after changes means you accept the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Contact Us
            </h2>

            <p className="leading-6">
              If you have any questions about these Terms & Conditions, please
              contact Veeo Store through the contact information available on
              our website.
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
            href="/policies"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Store Policies
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