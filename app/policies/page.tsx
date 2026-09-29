'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#7A1F3D]">
            Privacy Policy
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            How Veeo Store collects, uses, and protects customer information.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-600">

          {/* Introduction */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. Introduction
            </h2>

            <p className="leading-6">
              Veeo Store respects your privacy and is committed to protecting
              the personal information you provide when using our website,
              placing an order, or contacting us.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. Information We Collect
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>Name and contact information.</li>
              <li>Phone number and delivery address.</li>
              <li>Order and transaction information.</li>
              <li>Information you provide when contacting customer support.</li>
              <li>Technical information required to operate and improve our website.</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. How We Use Your Information
            </h2>

            <ul className="space-y-1.5 list-disc pl-5">
              <li>To process and fulfill orders.</li>
              <li>To arrange delivery and provide order updates.</li>
              <li>To communicate with customers regarding their orders.</li>
              <li>To provide customer support.</li>
              <li>To improve our products, services, and website.</li>
              <li>To prevent fraud or misuse of our services.</li>
            </ul>
          </section>

          {/* Payment Information */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Payment Information
            </h2>

            <p className="leading-6">
              Payment information may be processed through third-party payment
              service providers. Veeo Store does not intentionally store
              complete payment card details on its own systems.
            </p>
          </section>

          {/* Sharing Information */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Sharing of Information
            </h2>

            <p className="leading-6">
              We may share necessary customer information with trusted service
              providers, such as courier and payment service providers, when
              required to process and fulfill an order or provide our services.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Data Security
            </h2>

            <p className="leading-6">
              We take reasonable measures to protect customer information from
              unauthorized access, misuse, alteration, or disclosure. However,
              no online system can be guaranteed to be completely secure.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. Cookies
            </h2>

            <p className="leading-6">
              Our website may use cookies and similar technologies to maintain
              functionality, improve user experience, and understand website
              usage.
            </p>
          </section>

          {/* Customer Rights */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              8. Your Information
            </h2>

            <p className="leading-6">
              If you have questions about the personal information we hold
              about you or wish to request an update or correction, please
              contact us through the contact information available on our
              website.
            </p>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              9. Changes to This Policy
            </h2>

            <p className="leading-6">
              We may update this Privacy Policy when necessary. Any changes
              will be posted on this page.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Contact Us
            </h2>

            <p className="leading-6">
              If you have any questions about this Privacy Policy, please
              contact Veeo Store through the contact information available on
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
            href="/returns"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Returns & Refunds
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