'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function ContactPage() {
  const { settings } = useSettings();

  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const whatsapp = settings?.whatsapp_number || '';

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#7A1F3D]">
            Contact Us
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            We're here to help with your questions and orders.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid gap-3">

          {/* WhatsApp */}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-[#7A1F3D]/30 hover:bg-gray-50 transition"
            >
              <div className="h-9 w-9 rounded-full bg-[#7A1F3D]/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  WhatsApp
                </p>
                <p className="text-xs text-gray-500">
                  Chat with us for quick assistance
                </p>
              </div>
            </a>
          )}

          {/* Phone */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-[#7A1F3D]/30 hover:bg-gray-50 transition"
            >
              <div className="h-9 w-9 rounded-full bg-[#7A1F3D]/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Phone
                </p>
                <p className="text-xs text-gray-500">
                  {phone}
                </p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-[#7A1F3D]/30 hover:bg-gray-50 transition"
            >
              <div className="h-9 w-9 rounded-full bg-[#7A1F3D]/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Email
                </p>
                <p className="text-xs text-gray-500">
                  {email}
                </p>
              </div>
            </a>
          )}

          {/* Location */}
          <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-[#7A1F3D]/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-[#7A1F3D]" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                Location
              </p>
              <p className="text-xs text-gray-500">
                Pakistan
              </p>
            </div>
          </div>

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
            Policies
          </Link>

          <Link
            href="/terms"
            className="text-gray-500 hover:text-[#7A1F3D]"
          >
            Terms
          </Link>
        </div>

      </div>
    </main>
  );
}