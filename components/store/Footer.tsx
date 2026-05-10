'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  const { settings } = useSettings();
  const [year, setYear] = useState(2024);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const storeName = settings?.store_name || 'Store';
  const address = settings?.address || '';
  const phone = settings?.phone || '';
  const socialLinks = settings?.social_links || {};
  const aboutText = settings?.about_text || '';

  const socialIcons: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    youtube: 'YouTube',
  };

  return (
    <footer className="w-full bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{storeName}</h3>
            {aboutText && (
              <p className="text-xs text-gray-500 leading-relaxed">{aboutText}</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Links</h3>
            <nav className="flex flex-col gap-1.5">
              <Link href="/" className="text-xs text-gray-500 hover:text-green-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-xs text-gray-500 hover:text-green-600 transition-colors">
                Products
              </Link>
              <Link href="/cart" className="text-xs text-gray-500 hover:text-green-600 transition-colors">
                Cart
              </Link>
              <Link href="/account" className="text-xs text-gray-500 hover:text-green-600 transition-colors">
                Account
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact</h3>
            <div className="flex flex-col gap-1.5">
              {phone && (
                <p className="text-xs text-gray-500">{phone}</p>
              )}
              {address && (
                <p className="text-xs text-gray-500">{address}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Follow Us</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                const label = socialIcons[platform] || platform;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="text-center">
          <p className="text-xs text-gray-400">
            &copy; {year} {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
