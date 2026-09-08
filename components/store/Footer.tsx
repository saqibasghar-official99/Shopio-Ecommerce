// 'use client';

// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import {
//   Facebook,
//   Instagram,
//   Twitter,
//   Youtube,
//   Music2,
//   Phone,
//   MapPin,
//   MessageCircle,
//   Truck,
//   RotateCcw,
//   ShieldCheck,
//   ChevronRight,
// } from 'lucide-react';
// import { useSettings } from '@/contexts/SettingsContext';
// import { Separator } from '@/components/ui/separator';

// export default function Footer() {
//   const { settings } = useSettings();
//   const [year, setYear] = useState(new Date().getFullYear());

//   useEffect(() => {
//     setYear(new Date().getFullYear());
//   }, []);

//   const storeName = settings?.store_name || 'Store';
//   const address = settings?.address || '';
//   const phone = settings?.phone || '';
//   const whatsappNumber = settings?.whatsapp_number || '';
//   const whatsappMessage = settings?.whatsapp_message || '';
//   const socialLinks = settings?.social_links || {};

//   const aboutText =
//     settings?.about_text ||
//     'Discover quality products at great prices. Shop with confidence and enjoy a simple, secure shopping experience.';

//   /*
//    * Convert a Pakistani phone number into WhatsApp international format.
//    *
//    * Supported examples:
//    *
//    * 03471428593
//    * 0347 1428593
//    * 0347-1428593
//    * +92 347 1428593
//    * +923471428593
//    * 92 347 1428593
//    * 923471428593
//    * 0092 347 1428593
//    * 00923471428593
//    *
//    * Result:
//    * 923471428593
//    */
//   const normalizePakistanWhatsAppNumber = (value: string): string => {
//     if (!value) return '';

//     // Keep digits only
//     let number = value.replace(/\D/g, '');

//     // Remove international dialing prefix 00
//     if (number.startsWith('00')) {
//       number = number.substring(2);
//     }

//     // Local Pakistani format:
//     // 03471428593 -> 923471428593
//     if (number.startsWith('0')) {
//       number = `92${number.substring(1)}`;
//     }

//     // Already Pakistani international format:
//     // 923471428593 -> 923471428593
//     if (number.startsWith('92')) {
//       return number;
//     }

//     // If someone enters the mobile number without 0 or 92:
//     // 3471428593 -> 923471428593
//     if (number.length === 10 && number.startsWith('3')) {
//       number = `92${number}`;
//     }

//     return number;
//   };

//   const cleanPhone = phone.replace(/\D/g, '');

//   const whatsappInternationalNumber =
//     normalizePakistanWhatsAppNumber(whatsappNumber);

//   /*
//    * WhatsApp chat URL.
//    *
//    * Example:
//    * https://wa.me/923471428593
//    *
//    * If a WhatsApp message is configured:
//    * https://wa.me/923471428593?text=Hello...
//    */
//   const whatsappUrl = whatsappInternationalNumber
//     ? `https://wa.me/${whatsappInternationalNumber}${
//         whatsappMessage
//           ? `?text=${encodeURIComponent(whatsappMessage)}`
//           : ''
//       }`
//     : '';

//   const socialItems = [
//     {
//       key: 'facebook',
//       label: 'Facebook',
//       icon: Facebook,
//     },
//     {
//       key: 'instagram',
//       label: 'Instagram',
//       icon: Instagram,
//     },
//     {
//       key: 'twitter',
//       label: 'Twitter',
//       icon: Twitter,
//     },
//     {
//       key: 'tiktok',
//       label: 'TikTok',
//       icon: Music2,
//     },
//     {
//       key: 'youtube',
//       label: 'YouTube',
//       icon: Youtube,
//     },
//   ];

//   return (
//     <footer className="w-full bg-secondary text-black mt-auto">

//       {/* Trust / Benefits Bar */}
//       <div className="border-b border-gray-400">
//         <div className="max-w-7xl mx-auto px-4 py-5">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600/10">
//                 <Truck className="h-5 w-5 text-[#7A1F3D]" />
//               </div>

//               <div>
//                 <p className="text-sm font-medium text-black">
//                   Fast Delivery
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   Quick & reliable shipping
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600/10">
//                 <RotateCcw className="h-5 w-5 text-[#7A1F3D]" />
//               </div>

//               <div>
//                 <p className="text-sm font-medium text-black">
//                   Easy Returns
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   Hassle-free returns
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600/10">
//                 <ShieldCheck className="h-5 w-5 text-[#7A1F3D]" />
//               </div>

//               <div>
//                 <p className="text-sm font-medium text-black">
//                   Secure Shopping
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   Safe & secure checkout
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600/10">
//                 <MessageCircle className="h-5 w-5 text-[#7A1F3D]" />
//               </div>

//               <div>
//                 <p className="text-sm font-medium text-black">
//                   Customer Support
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   We're here to help
//                 </p>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>

//       {/* Main Footer */}
//       <div className="max-w-7xl mx-auto px-4 py-10">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

//           {/* Store Info */}
//           <div className="lg:col-span-1">
//             <Link
//               href="/"
//               className="inline-block text-xl font-bold hover:text-[#7A1F3D] transition-colors"
//             >
//               {storeName}
//             </Link>

//             <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-sm">
//               {aboutText}
//             </p>

//             {/* Social Icons */}
//             {socialItems.some(({ key }) => socialLinks[key]) && (
//               <div className="mt-5">
//                 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
//                   Follow Us
//                 </p>

//                 <div className="flex items-center gap-2">
//                   {socialItems.map(({ key, label, icon: Icon }) => {
//                     const url = socialLinks[key];

//                     if (!url) return null;

//                     return (
//                       <a
//                         key={key}
//                         href={url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         aria-label={label}
//                         title={label}
//                         className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:border-[#7A1F3D] hover:bg-[#7A1F3D] hover:text-white transition-all"
//                       >
//                         <Icon className="h-4 w-4" />
//                       </a>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Shop */}
//           <div>
//             <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
//               Shop
//             </h3>

//             <nav className="flex flex-col gap-3">
//               <Link
//                 href="/"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Home
//               </Link>

//               <Link
//                 href="/products"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 All Products
//               </Link>

//               <Link
//                 href="/cart"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Shopping Cart
//               </Link>

//               <Link
//                 href="/account"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 My Account
//               </Link>

//               <Link
//                 href="/orders"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D]  transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Track Order
//               </Link>
//             </nav>
//           </div>

//           {/* Customer Service */}
//           <div>
//             <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
//               Customer Service
//             </h3>

//             <nav className="flex flex-col gap-3">
//               <Link
//                 href="/contact"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               style={{display:'none'}}>
//                 <ChevronRight className="h-3 w-3" />
//                 Contact Us
//               </Link>

//               <Link
//                 href="/policies"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Shipping Information
//               </Link>

//               <Link
//                 href="/policies"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Returns & Refunds
//               </Link>

//               <Link
//                 href="/policies"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Privacy Policy
//               </Link>

//               <Link
//                 href="/terms"
//                 className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//               >
//                 <ChevronRight className="h-3 w-3" />
//                 Terms & Conditions
//               </Link>
//             </nav>
//           </div>

//           {/* Contact */}
//           <div>
//             <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
//               Get In Touch
//             </h3>

//             <div className="space-y-4">

//               {address && (
//                 <div className="flex items-start gap-3">
//                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-900 border border-gray-800">
//                     <MapPin className="h-4 w-4 text-green-500" />
//                   </div>

//                   <p className="text-sm text-gray-400 leading-relaxed">
//                     {address}
//                   </p>
//                 </div>
//               )}

//               {phone && (
//                 <a
//                   href={`tel:${cleanPhone}`}
//                   className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//                 >
//                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#7A1F3D] border">
//                     <Phone className="h-4 w-4 text-white" />
//                   </div>

//                   <span>{phone}</span>
//                 </a>
//               )}

//               {/* WhatsApp Chat */}
//               {whatsappInternationalNumber && (
//                 <a
//                   href={whatsappUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#7A1F3D] transition-colors"
//                 >
//                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#7A1F3D] border">
//                     <MessageCircle className="h-4 w-4 text-white" />
//                   </div>

//                   <span>Chat on WhatsApp</span>
//                 </a>
//               )}

//               {/* WhatsApp CTA */}
//               {whatsappInternationalNumber && (
//                 <a
//                   href={whatsappUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-white border border-[#7A1F3D] px-5 py-2 text-sm font-medium text-[#7A1F3D] hover:bg-[#7A1F3D] hover:text-white transition-colors"
//                 >
//                   <MessageCircle className="h-4 w-4" />
//                   Chat With Us
//                 </a>
//               )}

//             </div>
//           </div>
//         </div>

//         <Separator className="my-8 bg-gray-400" />

//         {/* Bottom Footer */}
//         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//           <p className="text-xs text-gray-500 text-center md:text-left">
//             © {year} {storeName}. All rights reserved.
//           </p>

//           <div className="flex items-center gap-5 text-xs text-gray-500">
//             <Link
//               href="/privacy"
//               className="hover:text-[#7A1F3D] transition-colors"
//             >
//               Privacy
//             </Link>

//             <Link
//               href="/terms"
//               className="hover:text-[#7A1F3D] transition-colors"
//             >
//               Terms
//             </Link>

//             <Link
//               href="/contact"
//               className="hover:text-[#7A1F3D] transition-colors"
//             >
//               Contact
//             </Link>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }


'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Phone,
  MapPin,
  MessageCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

import { useSettings } from '@/contexts/SettingsContext';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  const { settings } = useSettings();
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const storeName = settings?.store_name || 'Store';
  const address = settings?.address || '';
  const phone = settings?.phone || '';
  const whatsappNumber = settings?.whatsapp_number || '';
  const whatsappMessage = settings?.whatsapp_message || '';
  const socialLinks = settings?.social_links || {};

  const aboutText =
    settings?.about_text ||
    'Discover quality products at great prices. Shop with confidence and enjoy a simple, secure shopping experience.';

  // ============================================================
  // WHATSAPP NUMBER
  // ============================================================

  const normalizePakistanWhatsAppNumber = (
    value: string
  ): string => {
    if (!value) return '';

    let number = value.replace(/\D/g, '');

    if (number.startsWith('00')) {
      number = number.substring(2);
    }

    if (number.startsWith('0')) {
      number = `92${number.substring(1)}`;
    }

    if (number.startsWith('92')) {
      return number;
    }

    if (
      number.length === 10 &&
      number.startsWith('3')
    ) {
      number = `92${number}`;
    }

    return number;
  };

  const cleanPhone = phone.replace(/\D/g, '');

  const whatsappInternationalNumber =
    normalizePakistanWhatsAppNumber(
      whatsappNumber
    );

  const whatsappUrl =
    whatsappInternationalNumber
      ? `https://wa.me/${whatsappInternationalNumber}${
          whatsappMessage
            ? `?text=${encodeURIComponent(
                whatsappMessage
              )}`
            : ''
        }`
      : '';

  // ============================================================
  // SOCIAL LINKS
  // ============================================================

  const socialItems = [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: Facebook,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: Instagram,
    },
    {
      key: 'twitter',
      label: 'Twitter',
      icon: Twitter,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: Music2,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: Youtube,
    },
  ];

  const hasSocialLinks = socialItems.some(
    ({ key }) => socialLinks[key]
  );

  // ============================================================
  // FOOTER
  // ============================================================

  return (
    <footer className="w-full mt-auto bg-secondary text-black">

      {/* ======================================================
          TRUST BAR
      ====================================================== */}

      <div className="border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 py-4">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">

            {/* Fast Delivery */}

            <div className="flex items-center gap-2.5 min-w-0">

              <div className="h-8 w-8 shrink-0 rounded-full bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                <Truck className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-900">
                  Fast Delivery
                </p>

                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                  Quick & reliable shipping
                </p>
              </div>

            </div>

            {/* Easy Returns */}

            <div className="flex items-center gap-2.5 min-w-0">

              <div className="h-8 w-8 shrink-0 rounded-full bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                <RotateCcw className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-900">
                  Easy Returns
                </p>

                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                  Hassle-free returns
                </p>
              </div>

            </div>

            {/* Secure Shopping */}

            <div className="flex items-center gap-2.5 min-w-0">

              <div className="h-8 w-8 shrink-0 rounded-full bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-900">
                  Secure Shopping
                </p>

                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                  Safe & secure checkout
                </p>
              </div>

            </div>

            {/* Customer Support */}

            <div className="flex items-center gap-2.5 min-w-0">

              <div className="h-8 w-8 shrink-0 rounded-full bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-[#7A1F3D]" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-900">
                  Customer Support
                </p>

                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                  We're here to help
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          MAIN FOOTER
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 py-7 sm:py-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-7 lg:gap-x-12">

          {/* ==================================================
              STORE INFO
          ================================================== */}

          <div className="col-span-2 md:col-span-1">

            <Link
              href="/"
              className="inline-block text-lg font-bold tracking-tight text-gray-950 hover:text-[#7A1F3D] transition-colors"
            >
              {storeName}
            </Link>

            <p className="mt-2.5 text-[11px] sm:text-xs text-gray-500 leading-relaxed max-w-xs">
              {aboutText}
            </p>

            {/* SOCIAL */}

            {hasSocialLinks && (
              <div className="mt-4">

                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                  Follow Us
                </p>

                <div className="flex items-center gap-1.5">

                  {socialItems.map(
                    ({
                      key,
                      label,
                      icon: Icon,
                    }) => {
                      const url =
                        socialLinks[key];

                      if (!url) return null;

                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          title={label}
                          className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[#7A1F3D] hover:bg-[#7A1F3D] hover:text-white transition-all duration-200"
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </a>
                      );
                    }
                  )}

                </div>

              </div>
            )}

          </div>

          {/* ==================================================
              SHOP
          ================================================== */}

          <div>

            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-900 mb-3">
              Shop
            </h3>

            <nav className="flex flex-col gap-2">

              <Link
                href="/"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D] transition-colors" />
                Home
              </Link>

              <Link
                href="/products"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D] transition-colors" />
                All Products
              </Link>

              <Link
                href="/cart"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D] transition-colors" />
                Shopping Cart
              </Link>

              <Link
                href="/account"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D] transition-colors" />
                My Account
              </Link>

              <Link
                href="/orders"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D] transition-colors" />
                Track Order
              </Link>

            </nav>

          </div>

          {/* ==================================================
              CUSTOMER SERVICE
          ================================================== */}

          <div>

            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-900 mb-3">
              Customer Service
            </h3>

            <nav className="flex flex-col gap-2">

              <Link
                href="/policies"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D]" />
                Shipping Information
              </Link>

              <Link
                href="/policies"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D]" />
                Returns & Refunds
              </Link>

              <Link
                href="/policies"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D]" />
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="group flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-[#7A1F3D]" />
                Terms & Conditions
              </Link>

            </nav>

          </div>

          {/* ==================================================
              CONTACT
          ================================================== */}

          <div className="col-span-2 md:col-span-1">

            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-900 mb-3">
              Get In Touch
            </h3>

            <div className="space-y-2.5">

              {/* ADDRESS */}

              {address && (
                <div className="flex items-start gap-2.5">

                  <div className="h-7 w-7 shrink-0 rounded-md bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-[#7A1F3D]" />
                  </div>

                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed pt-0.5">
                    {address}
                  </p>

                </div>
              )}

              {/* PHONE */}

              {phone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-2.5 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
                >

                  <div className="h-7 w-7 shrink-0 rounded-md bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                    <Phone className="h-3.5 w-3.5 text-[#7A1F3D]" />
                  </div>

                  <span>{phone}</span>

                </a>
              )}

              {/* WHATSAPP */}

              {whatsappInternationalNumber && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[11px] sm:text-xs text-gray-500 hover:text-[#7A1F3D] transition-colors"
                >

                  <div className="h-7 w-7 shrink-0 rounded-md bg-[#7A1F3D]/[0.07] flex items-center justify-center">
                    <MessageCircle className="h-3.5 w-3.5 text-[#7A1F3D]" />
                  </div>

                  <span>Chat on WhatsApp</span>

                </a>
              )}

              {/* COMPACT WHATSAPP CTA */}

              {whatsappInternationalNumber && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center justify-center gap-1.5 mt-1 rounded-lg bg-[#7A1F3D] px-3 py-2 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm hover:bg-[#641831] hover:shadow transition-all duration-200"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Order via WhatsApp
                </a>
              )}

            </div>

          </div>

        </div>

        {/* ======================================================
            BOTTOM
        ====================================================== */}

        <Separator className="my-6 bg-gray-200" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">

          <p className="text-[9px] sm:text-[10px] text-gray-400 text-center sm:text-left">
            © {year} {storeName}. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-[9px] sm:text-[10px] text-gray-400">

            <Link
              href="/privacy"
              className="hover:text-[#7A1F3D] transition-colors"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-[#7A1F3D] transition-colors"
            >
              Terms
            </Link>

            <Link
              href="/contact"
              className="hover:text-[#7A1F3D] transition-colors"
            >
              Contact
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}