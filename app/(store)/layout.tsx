// import { CartProvider } from '@/contexts/CartContext';
// import { SettingsProvider } from '@/contexts/SettingsContext';
// import { ToastProvider } from '@/contexts/ToastContext';
// import AnnouncementBar from '@/components/store/AnnouncementBar';
// import Navbar from '@/components/store/Navbar';
// import Footer from '@/components/store/Footer';
// import WhatsAppButton from '@/components/store/WhatsAppButton';
// import BottomNav from '@/components/store/BottomNav';
// import { getSettings } from '@/lib/server/queries';
// import type { SiteSettings } from '@/lib/types';

// export default async function StoreLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   // Pre-fetch settings on the server so navbar/footer/announcement bar render
//   // with real data on first paint. cached() de-dupes if the page also calls it.
//   const initialSettings = (await getSettings()) as unknown as SiteSettings | null;

//   return (
//     <SettingsProvider initial={initialSettings}>
//       <CartProvider>
//         <ToastProvider>
//           <div className="flex flex-col min-h-screen">
//             <AnnouncementBar />
//             <Navbar />
//             <main className="flex-1 min-h-screen pb-20 md:pb-0">
//               {children}
//             </main>
//             <Footer />
//             <WhatsAppButton />
//             <BottomNav />
//           </div>
//         </ToastProvider>
//       </CartProvider>
//     </SettingsProvider>
//   );
// }




import { SettingsProvider } from '@/contexts/SettingsContext';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { getSettings } from '@/lib/server/queries';
import type { SiteSettings } from '@/lib/types';
import { Sparkles, ArrowDown } from 'lucide-react';
import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = (await getSettings()) as unknown as SiteSettings | null;

  return (
    <SettingsProvider initial={initialSettings}>
      <div
        className={`${playfair.variable} ${dmSans.variable} min-h-screen overflow-hidden bg-[#fcf8f5]`}
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        <main className="relative min-h-screen overflow-hidden">

          {/* ========================================
              BACKGROUND
          ======================================== */}

          {/* Soft gradient atmosphere */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-64 -top-64 h-[700px] w-[700px] rounded-full bg-[#7A1F3D]/8 blur-[120px]" />

            <div className="absolute -right-64 top-[15%] h-[650px] w-[650px] rounded-full bg-[#d6a36c]/10 blur-[120px]" />

            <div className="absolute bottom-[-300px] left-[25%] h-[600px] w-[600px] rounded-full bg-[#7A1F3D]/6 blur-[120px]" />
          </div>

          {/* Fine grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(#7A1F3D 1px, transparent 1px),
                linear-gradient(90deg, #7A1F3D 1px, transparent 1px)
              `,
              backgroundSize: '70px 70px',
            }}
          />

          {/* Decorative circles */}
          <div className="pointer-events-none absolute left-[8%] top-[25%] h-2 w-2 rounded-full bg-[#7A1F3D]/40 animate-pulse" />
          <div className="pointer-events-none absolute right-[13%] top-[30%] h-3 w-3 rounded-full bg-[#c58a52]/40 animate-pulse" />
          <div className="pointer-events-none absolute bottom-[25%] left-[18%] h-1.5 w-1.5 rounded-full bg-[#7A1F3D]/30 animate-pulse" />
          <div className="pointer-events-none absolute bottom-[18%] right-[25%] h-2 w-2 rounded-full bg-[#c58a52]/30 animate-pulse" />

          {/* ========================================
              TOP BRAND MARK
          ======================================== */}

          <div className="relative z-10 flex justify-center px-6 pt-10 sm:pt-14">
            <div className="flex items-center gap-4">
              <div className="h-px w-10 bg-[#7A1F3D]/30 sm:w-16" />

              <span
                className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#7A1F3D]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Coming Soon
              </span>

              <div className="h-px w-10 bg-[#7A1F3D]/30 sm:w-16" />
            </div>
          </div>

          {/* ========================================
              HERO
          ======================================== */}

          <section className="relative z-10 flex min-h-[calc(100vh-90px)] items-center justify-center px-5 py-20 sm:px-8">

            <div className="mx-auto w-full max-w-6xl text-center">

              {/* Small badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#7A1F3D]/10 bg-white/70 px-5 py-2.5 shadow-[0_8px_30px_rgba(122,31,61,0.06)] backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5 text-[#7A1F3D]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7A1F3D] sm:text-xs">
                  A new experience is arriving
                </span>
              </div>

              {/* Main heading */}
              <h1
                className="mx-auto text-[4.5rem] font-medium leading-[0.88] tracking-[-0.055em] text-[#20171a] sm:text-[6.5rem] md:text-[8rem] lg:text-[10rem]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Launching

                <span className="relative mt-2 block italic text-[#7A1F3D] sm:mt-4">
                  Soon
                </span>
              </h1>

              {/* Gold accent */}
              <div className="mx-auto mt-7 flex items-center justify-center gap-3">
                <span className="h-px w-12 bg-[#c99a63]/50 sm:w-20" />

                <span className="h-1.5 w-1.5 rotate-45 bg-[#c99a63]" />

                <span className="h-px w-12 bg-[#c99a63]/50 sm:w-20" />
              </div>

              {/* Description */}
              <p
                className="mx-auto mt-8 max-w-xl text-sm leading-7 text-[#62585a] sm:text-base sm:leading-8"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                We&apos;re creating something beautiful behind the scenes.
                A refined shopping experience is being crafted with care
                and will be ready for you very soon.
              </p>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-center gap-5">

                <div className="group inline-flex cursor-pointer items-center gap-4 rounded-full border border-[#7A1F3D]/15 bg-[#7A1F3D] px-7 py-3.5 text-white shadow-[0_15px_40px_rgba(122,31,61,0.18)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(122,31,61,0.25)]">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Stay Tuned
                  </span>

                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 group-hover:translate-x-1">
                    <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                  </span>
                </div>

                <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#9b9192]">
                  Something special is on its way
                </span>
              </div>

              {/* ========================================
                  BOTTOM DECORATION
              ======================================== */}

              <div className="mx-auto mt-20 flex max-w-xs items-center justify-center gap-6 opacity-60">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#7A1F3D]/20" />

                <div
                  className="text-[10px] uppercase tracking-[0.4em] text-[#7A1F3D]"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Est. 2026
                </div>

                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#7A1F3D]/20" />
              </div>

            </div>
          </section>

          {/* Bottom gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#7A1F3D]/[0.025] to-transparent" />

        </main>

        <WhatsAppButton />
      </div>
    </SettingsProvider>
  );
}